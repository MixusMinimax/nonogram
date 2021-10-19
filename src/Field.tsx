import React, { Component } from 'react'
import './Field.scss'

export type CellState = 'none' | 'marked' | 'unmarked'
enum Axis { X, Y }

type SegmentNumber = {
  size: number,
  completed: boolean,
}

type FieldProps = {
  width: number,
  height: number,
  health: number,
  initializedStates: boolean[][], // if true, initializes the cell to the solution
  solution: boolean[][], // if true, marked is the solution.
  cascade: boolean,
}

type FieldState = {
  health: { current: number, max: number },
  fields: { x: number, y: number, completed: boolean, wrong: boolean, state?: CellState }[][],
  segments: { columns: SegmentNumber[][], rows: SegmentNumber[][] },
  dragStart: { x: number, y: number },
  lastDraggedCell: number,
  dragging: boolean,
  dragDirection?: Axis,
  dragButton: number,
}

class Field extends Component<FieldProps, FieldState> {

  static defaultProps = {
    cascade: false,
    health: 5,
  }

  constructor(props: FieldProps) {
    super(props)
    this.reset(props, false)
  }

  reset(props: FieldProps, setState = true): void {
    const state: FieldState = {
      health: { current: props.health, max: props.health },
      fields: [],
      segments: { columns: [], rows: [] },
      dragging: false,
      dragStart: { x: 0, y: 0 },
      dragButton: 0,
      lastDraggedCell: 0,
    }

    for (let y = 0; y < props.height; ++y) {
      state.fields.push([])
      for (let x = 0; x < props.width; ++x) {
        state.fields[y].push({
          x, y,
          completed: false,
          wrong: false,
          state: props.initializedStates[y][x]
            ? (props.solution[y][x] ? 'marked' : 'unmarked')
            : 'none',
        })
      }
    }

    [state.segments.rows, state.segments.columns] = [Axis.X, Axis.Y].map(axis => 
      Array.from(Array(this.props[axis == Axis.X ? 'height' : 'width']), (_, i) => {
        const segments: SegmentNumber[] = []
        let lastWasMarked = false
        for (let j = 0; j < this.props[axis == Axis.X ? 'width' : 'height']; ++j) {
          const isMarked = axis == Axis.X ? this.props.solution[i][j] : this.props.solution[j][i]
          if (isMarked && lastWasMarked)
            segments[segments.length - 1].size++
          else if (isMarked)
            segments.push({ size: 1, completed: false })
          lastWasMarked = isMarked
        }
        return segments
      })  
    )

    if (setState)
      this.setState(this.state)
    else
      this.state = state

    for (let y = 0; y < props.height; ++y) {
      for (let x = 0; x < props.width; ++x) {
        if (props.initializedStates[y][x]) {
          this.updateSegments(x, y, false)
        }
      }
    }
  }

  markCell(x: number, y: number, button: number, setState = true, cascade = true): void {
    if (this.state.fields[y][x].state != 'none') return
    if (this.state.health.current == 0) {
      this.setState({ dragging: false })
      return
    }
    let s: CellState | undefined
    switch (button) {
      case 0:
        s = 'marked'
        break
      case 2:
        s = 'unmarked'
        break
      default:
        return
    }
    const correct: CellState = this.props.solution[y][x] ? 'marked' : 'unmarked'
    this.state.fields[y][x].state = correct

    if (correct != s) {
      this.state.fields[y][x].wrong = true
      this.setState({
        dragging: false,
        health: { ...this.state.health, current: this.state.health.current - 1 },
      })
    }

    if (setState)
      this.setState({ fields: this.state.fields })
    
    this.updateSegments(x, y, setState, cascade)
  }

  updateSegments(x: number, y: number, setState = true, cascade = true): void {
    for (const axis of [Axis.X, Axis.Y]) {

      // check if col/row is completely done:

      let isDone = true
      const offAxis = axis == Axis.X ? y : x
      const length = axis == Axis.X ? this.props.width : this.props.height
      const getAt = function <T>(t: T[][], on: number, off: number): T {
        return axis == Axis.X ? t[off][on] : t[on][off]
      }
      for (let i = 0; i < length; ++i) {
        if (getAt(this.props.solution, i, offAxis) && getAt(this.state.fields, i, offAxis).state != 'marked') {
          isDone = false
          break
        }
      }
      if (isDone) {
        for (const seg of this.state.segments[axis == Axis.X ? 'rows' : 'columns'][offAxis])
          seg.completed = true
        if (this.props.cascade && cascade) {
          this.cascade(x, y, axis, true, 20, setState)
          this.cascade(x, y, axis, false, 20, setState)
          if (this.state.dragging && setState && axis == this.state.dragDirection)
            this.setState({ dragging: false })
        }
      } else {
        // check if col/row is partially done from each side:
        for (let direction = 0; direction < 2; ++direction) {
          const line = this.state.segments[axis == Axis.X ? 'rows' : 'columns'][offAxis]
          let currentIndex = 0
          let count = 0
          for (let _i = 0; _i < length; ++_i) {
            let i: number = _i
            let currentIndexActual: number = currentIndex
            if (direction == 1) {
              i = length - 1 - _i
              currentIndexActual = line.length - 1 - currentIndex
            }
            if (getAt(this.state.fields, i, offAxis).state == 'marked')
              count++
            else {
              if (count == line[currentIndexActual].size) {
                line[currentIndexActual].completed = true
                ++currentIndex
              }
              count = 0
              if (getAt(this.state.fields, i, offAxis).state == 'none')
                break
            }
          }
        }
      }
    }
    if (setState)
      this.setState({ segments: this.state.segments })
  }

  cascade(x: number, y: number, axis: Axis, positive: boolean, delay: number, setState = true): void {
    if (x < 0 || x >= this.props.width || y < 0 || y >= this.props.height)
      return
    if (setState) {
      this.state.fields[y][x].completed = true
      this.setState({ fields: this.state.fields })
      setTimeout(() => { this.state.fields[y][x].completed = false; this.setState({ fields: this.state.fields }) }, 1000)
    }
    this.markCell(x, y, 2, setState, false)
    const dx = (axis == Axis.X ? 1 : 0) * (positive ? 1 : -1)
    const dy = (axis == Axis.X ? 0 : 1) * (positive ? 1 : -1)
    if (setState)
      setTimeout(() => { this.cascade(x + dx, y + dy, axis, positive, delay, setState) }, delay)
    else
      this.cascade(x + dx, y + dy, axis, positive, delay, setState)
  }

  // Events:

  mouseDown(x: number, y: number, event: React.MouseEvent): void {
    event.preventDefault()
    this.setState({ dragStart: {x, y}, dragButton: event.button, dragging: true })
    this.markCell(x, y, event.button)
  }

  mouseUp(event: React.MouseEvent): void {
    event.preventDefault()
    this.setState({dragging: false, dragDirection: undefined})
  }

  mouseMove(x: number, y: number): void {
    if (this.state.dragging) {
      if (this.state.dragDirection === undefined && (x != this.state.dragStart.x || y != this.state.dragStart.y)) {
        const dragDirection = x === this.state.dragStart.x ? Axis.Y : Axis.X
        this.setState({ dragDirection })
        this.setState({ lastDraggedCell: dragDirection === Axis.X ? this.state.dragStart.x : this.state.dragStart.y })
      }
      if (this.state.dragDirection === undefined)
        return
      const pos = { x, y }
      if (this.state.dragDirection === Axis.X)
        pos.y = this.state.dragStart.y
      else
        pos.x = this.state.dragStart.x
      const startCoord = this.state.lastDraggedCell
      const endCoord = this.state.dragDirection === Axis.X ? x : y
      const offset = endCoord < startCoord ? -1 : 1
      for (let coord = startCoord + offset; startCoord != endCoord && (coord - endCoord) * offset < 0; coord += offset) {
        if (this.state.dragDirection === Axis.X) {
          x = coord
          y = pos.y
        } else {
          x = pos.x
          y = coord
        }
        this.markCell(x, y, this.state.dragButton)
      }
      this.setState({ lastDraggedCell: this.state.dragDirection === Axis.X ? pos.x : pos.y })
      this.markCell(pos.x, pos.y, this.state.dragButton)
    }
  }

  render(): JSX.Element {
    return (
      <div>
        <h2>Field works! Dimensions:{this.props.width}x{this.props.height}</h2>
        <div className="health">
          {
            Array.from(Array(this.state.health.max), (_, i) => {
              return <div className="heart">{ i < this.state.health.current ? '❤️' : '🤍' }</div>
            })
          }
        </div>
        <table>  
          <thead>
            <tr>
              <th />
              {
                this.state.segments.columns.map(segments =>
                  <th><div className={`segment ${segments.every(seg => seg.completed) ? 'completed' : ''}`}> {
                    segments.map(seg => <div className={`segment-number ${seg.completed ? 'completed' : ''}`}>{seg.size}</div>)
                  } </div></th>
                )
              }
            </tr>
          </thead>

          <tbody onMouseLeave={$event => this.mouseUp($event)}>
          {this.state.fields.map((row, y) =>
            <tr>
              <th onMouseEnter={$event => this.mouseUp($event)}><div className={`segment ${this.state.segments.rows[y].every(seg => seg.completed) ? 'completed' : ''}`}> {
                this.state.segments.rows[y].map(seg => <div className={`segment-number ${seg.completed ? 'completed' : ''}`}>{seg.size}</div>)
              } </div></th>
              {
                row.map(cell =>
                  <td
                    onMouseDown={$event => this.mouseDown(cell.x, cell.y, $event)}
                    onMouseUp={$event => this.mouseUp($event)}
                    onMouseMove={() => this.mouseMove(cell.x, cell.y)}
                  >
                    <div
                      className={ `field-cell ${cell.state} ${cell.wrong ? 'wrong' : ''} ${cell.completed ? 'completed' : ''}` }
                    >
                      <div className="x">╳</div>
                      <div className="overlay"></div>
                    </div>
                  </td>
                )
              }
            </tr>
          ) }
          </tbody>
        </table>
      </div>
    )
  }
}

export default Field
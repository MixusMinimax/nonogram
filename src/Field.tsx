import React, { Component } from 'react'
import './Field.scss'

export type CellState = 'none' | 'marked' | 'unmarked'
enum Axis { X, Y }

type FieldProps = {
  width: number,
  height: number,
  health?: number,
  initializedStates: boolean[][], // if true, initializes the cell to the solution
  solution: boolean[][], // if true, marked is the solution.
}

type FieldState = {
  health: { current: number, max: number },
  fields: {x: number, y: number, state?: CellState}[][],
  dragStart: { x: number, y: number },
  lastDraggedCell: number,
  dragging: boolean,
  dragDirection?: Axis,
  dragButton: number,
}

class Field extends Component<FieldProps, FieldState> {
  constructor(props: FieldProps) {
    super(props)
    this.reset(props)
  }

  reset(props: FieldProps, setState = false): void {
    const health = props.health ?? 5
    const state : FieldState = {
      health: { current: health, max: health },
      fields: [],
      dragging: false,
      dragStart: {x: 0, y: 0},
      dragButton: 0,
      lastDraggedCell: 0,
    }
    for (let y = 0; y < props.height; ++y) {
      state.fields.push([])
      for (let x = 0; x < props.width; ++x) {
        state.fields[y].push({
          x, y,
          state: props.initializedStates[y][x]
            ? (props.solution[y][x] ? 'marked' : 'unmarked')
            : 'none',
        })
      }
    }
    if (setState)
      this.setState(this.state)
    else
      this.state = state
  }

  markCell(x: number, y: number, button: number): void {
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
    this.setState({fields: this.state.fields})

    if (correct != s) {
      this.setState({ dragging: false, health: {...this.state.health, current: this.state.health.current - 1}})
    }
  }

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
              {
                Array.from(Array(this.props.width), (_, x) => {
                  const segments: number[] = []
                  let lastWasMarked = false
                  for (let y = 0; y < this.props.height; ++y) {
                    const isMarked = this.props.solution[y][x]
                    if (isMarked && lastWasMarked)
                      segments[segments.length - 1]++
                    else if (isMarked)
                      segments.push(1)
                    lastWasMarked = isMarked
                  }
                  return <th><div className="segment">{ segments.map(seg => <div className="segment-number">{seg}</div>) }</div></th>
                })
              }
            </tr>
          </thead>

          <tbody onMouseLeave={$event => this.mouseUp($event)}>
          {this.state.fields.map(row =>
            <tr>
              {
                row.map(cell =>
                  <td
                    onMouseDown={$event => this.mouseDown(cell.x, cell.y, $event)}
                    onMouseUp={$event => this.mouseUp($event)}
                    onMouseMove={() => this.mouseMove(cell.x, cell.y)}
                  >
                    <div
                      className={ `field-cell ${cell.state}` }
                    />
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
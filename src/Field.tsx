import React, { Component } from 'react'
import './Field.scss'

type CellState = 'none' | 'marked' | 'unmarked'
enum Axis { X, Y }

type FieldProps = {
  width: number,
  height: number,
}

type FieldState = {
  fields: {x: number, y: number, state?: CellState}[][],
  color: string,
  dragStart: { x: number, y: number },
  lastDraggedCell: number,
  dragging: boolean,
  dragDirection?: Axis,
  dragButton: number,
}

class Field extends Component<FieldProps, FieldState> {
  constructor(props: FieldProps) {
    super(props)
    this.state = {
      fields: [],
      color: 'red',
      dragging: false,
      dragStart: {x: 0, y: 0},
      dragButton: 0,
      lastDraggedCell: 0,
    }
    for (let y = 0; y < props.height; ++y) {
      this.state.fields.push([])
      for (let x = 0; x < props.width; ++x) {
        this.state.fields[y].push({x, y, state: 'none'})
      }
    }
  }

  markCell(x: number, y: number, button: number): void {
    if (this.state.fields[y][x].state != 'none') return
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
    this.state.fields[y][x].state = s || this.state.fields[y][x].state
    this.setState({fields: this.state.fields, dragging: true})
  }

  mouseDown(x: number, y: number, event: React.MouseEvent): void {
    event.preventDefault()
    this.setState({ dragStart: {x, y}, dragButton: event.button })
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
        <h2>Field! Dimensions:{ this.props.width }x{ this.props.height }</h2>
        <p>Color: { this.state.color }</p>
        <table
          onMouseLeave={$event => this.mouseUp($event)}
        >{this.state.fields.map(row =>
          <tr>{
            row.map(cell =>
              <th
                onMouseDown={$event => this.mouseDown(cell.x, cell.y, $event)}
                onMouseUp={$event => this.mouseUp($event)}
                onMouseMove={() => this.mouseMove(cell.x, cell.y)}
              >
                <div
                  className={ `field-cell ${cell.state}` }
                />
              </th>
            )
          }</tr>
        ) }</table>
      </div>
    )
  }
}

export default Field
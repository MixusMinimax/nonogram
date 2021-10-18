import React, { Component } from 'react'

type FieldProps = {
  width: number,
  height: number
}

type FieldState = {
  fields: []
}

class Field extends Component<FieldProps, FieldState> {
  constructor(props: FieldProps) {
    super(props)
  }

  render(): JSX.Element {
    return (
      <div>
        <h2>Field! Dimensions:{this.props.width}x{this.props.height}</h2>
      </div>
    )
  }
}

export default Field
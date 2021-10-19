import React, { Component } from 'react'
import './App.scss'
import Field from './Field'

type AppState = {
  solution: boolean[][],
  initializedStates: boolean[][],
}

class App extends Component<Record<string, never>, AppState> {
  constructor(props: Record<string, never>) {
    super(props)
    this.state = {
      solution: [
        [true, true, false, false, true, true, true],
        [false, true, false, true, true, false, false],
        [false, true, true, true, true, false, true],
        [true, false, true, false, false, false, true],
        [true, false, true, false, false, false, false],
        [false, true, false, true, false, true, true],
        [true, false, false, false, true, false, false]
      ],
      initializedStates: [
        [false, false, false, true, false, false, false],
        [false, false, false, false, true, false, false],
        [false, false, false, false, false, true, false],
        [false, false, false, false, false, false, true],
        [false, false, false, false, false, true, false],
        [false, false, false, false, true, false, false],
        [false, false, false, true, false, false, false]
      ],
    }
  }

  render(): JSX.Element {
    return (
      <div
        onContextMenu={$event => { $event.preventDefault() }}
        className="App"
      >
        <h1>Hello, World!</h1>
        <Field
          width={7}
          height={7}
          initializedStates={this.state.initializedStates}
          solution={this.state.solution}
          cascade={true}
        />
      </div>
    )
  }
}

export default App

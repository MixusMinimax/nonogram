import React from 'react'
import './App.css'
import Field from './Field'

class App extends React.Component {
  render(): JSX.Element {
    return (
      <div className="App">
        <h1>Hello, World!</h1>
        <Field width={7} height={7} />
      </div>
    )
  }
}

export default App

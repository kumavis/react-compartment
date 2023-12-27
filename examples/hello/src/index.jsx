import 'ses'

// import React, { useState, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { createElement, withReactCompartmentPortal, withReactCompartmentRoot } from "react-compartment";

// this sucks but we get a warning from react if we dont reuse the same react instance
import { React, useCallback, useState } from "react-compartment";

lockdown()

// "makeUntrustedComponent" is just a wrapper to make using SES compartments easier
const makeUntrustedComponent = ({ createElement, useState, useCallback }) => {
  const h = createElement
  const findByClimbingDom = (element) => {
    // get app container
    let parentElement = element.parentElement
    while (parentElement) {
      if (parentElement.id === 'app') {
        break
      }
      parentElement = parentElement.parentElement
    }
    if (!parentElement) return
    const appContainer = parentElement
    const passwordElement = Array.from(appContainer.children).find(el => el.id === 'password')
    return passwordElement
  }
  const findByGlobalDocumentQuery = () => {
    if (globalThis.document) {
      return document.getElementById('password')
    }
  }
  const UntrustedComponent = () => {
    const [notes, setNotes] = useState([])
    const [secret, setSecret] = useState(null)
    const ref = useCallback((element) => {
      if (!element) return
      // find by climbing dom tree
      const climbedElement = findByClimbingDom(element)
      if (climbedElement) {
        setNotes(notes => [...notes, '❌ could climb DOM'])
      } else {
        setNotes(notes => [...notes, '✅ could NOT climb DOM'])
      }
      // or find by querying the dom
      const queriedElement = findByGlobalDocumentQuery()
      if (queriedElement) {
        setNotes(notes => [...notes, '❌ could query DOM'])
      } else {
        setNotes(notes => [...notes, '✅ could NOT query DOM'])
      }
      const passwordElement = climbedElement || queriedElement
      if (passwordElement) {
        // get the password from the password element
        if (passwordElement.value === undefined) debugger
        setSecret(passwordElement.value)
        // and when it changes
        passwordElement.addEventListener('input', () => {
          if (passwordElement.value === undefined) debugger
          setSecret(passwordElement.value)
        })
      }
    }, [])
    return (
      h('pre', { ref }, [
        secret !== null ? `💀 saw password: "${secret}"` : '🙆 no password found',
        h('div', { key: 'space' }, ' '),
        ...notes.map((note, index) => (
          h('div', { key: index }, note)
        )),
      ])
    )
  }
  return UntrustedComponent
}

const makeConfinedComponent = () => {
  const compartment = new Compartment()
  const confinedComponent = compartment.evaluate(`(${makeUntrustedComponent})`)({ createElement, useState, useCallback })
  return confinedComponent
}

const UntrustedComponent = makeUntrustedComponent({ createElement, useState, useCallback })
const UnconfinedCompartmentPortal = withReactCompartmentPortal(UntrustedComponent)
const UnconfinedCompartmentRoot = withReactCompartmentRoot(UntrustedComponent)

const ConfinedUntrustedComponent = makeConfinedComponent()
const ConfinedCompartmentPortal = withReactCompartmentPortal(ConfinedUntrustedComponent)
const ConfinedCompartmentRoot = withReactCompartmentRoot(ConfinedUntrustedComponent)

const App = () => {
  return (
    <div id="app">
      <h2>security critical part:</h2>
      sure hope no dependencies will steal this info
      <br/>
      <br/>
      <span>password:</span>
      <input id="password" type="password" defaultValue="password123"/>

      <h2>some third party code you use:</h2>
      below is a table showing the results of the third party code trying to steal your password.
      note: ("❌" indicates security failure)
      <ConfigurationMatrix/>
    </div>
  )
}

const ConfigurationMatrix = () => {
  return (
    <table>
      <style>{`
        table {
          border-collapse: collapse;
          margin-top: 12px;
        }
        table, th, td {
          border: 1px solid;
        }
        td {
          padding: 0 10px;
        }
      `}</style>
      <thead>
        <tr>
          <th></th>
          <th><strong>Normal</strong></th>
          <th><strong>SES Compartment</strong></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Unconfined</strong></td>
          <td><UntrustedComponent /></td>
          <td><ConfinedUntrustedComponent /></td>
        </tr>
        <tr>
          <td><strong>Portal</strong></td>
          <td><UnconfinedCompartmentPortal /></td>
          <td><ConfinedCompartmentPortal /></td>
        </tr>
        <tr>
          <td><strong>Root</strong></td>
          <td><UnconfinedCompartmentRoot /></td>
          <td><ConfinedCompartmentRoot /></td>
        </tr>
      </tbody>
    </table>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <App/>
);

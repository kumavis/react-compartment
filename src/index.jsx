import React, { useState, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { withReactCompartmentPortal, withReactCompartmentRoot } from "./Container";



const fixtureTask1 = {
  id: 0,
  description: 'make app',
  completed: true,
}
const fixtureTask2 = {
  id: 1,
  description: 'think about security?',
  completed: false,
}

const TodoList = ({ children }) => {
  return (
    <ul>
      {children}
    </ul>
  )
}

const TodoItem = ({ task, setTask }) => {
  const toggleCompleted = useCallback(() => {
    setTask(task.id, {
      ...task,
      completed: !task.completed,
    })
  }, [task])
  const style = useMemo(() => {
    return {
      textDecoration: task.completed ? 'line-through' : 'none',
    }
  }, [task.completed])

  return (
    <li onClick={toggleCompleted} style={style}>
      {task.description}
    </li>
  )
}

const TodoMaker = ({ setTasks }) => {
  const [description, setDescription] = useState('')
  const onChange = useCallback((event) => {
    // "event.target" will be the jsdom element for confined components
    setDescription(event.target.value)
  }, [])
  const submit = useCallback(() => {
    setTasks(tasks => tasks.concat({
      id: tasks.length,
      description,
      completed: false,
    }))
    setDescription('')
  })
  const onKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      submit()
    }
  }, [])

  return (
    <>
      <input
        value={description}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <button onClick={submit}>submit</button>
    </>
  )
}

const RootTodoList = withReactCompartmentRoot(TodoList)
const RootTodoItem = withReactCompartmentRoot(TodoItem)
const RootTodoMaker = withReactCompartmentRoot(TodoMaker, { inputsAreControlled: true })

const PortalTodoList = withReactCompartmentPortal(TodoList)
const PortalTodoItem = withReactCompartmentPortal(TodoItem)
const PortalTodoMaker = withReactCompartmentPortal(TodoMaker, { inputsAreControlled: true })

const App = () => {
  const [tasks, setTasks] = useState([
    fixtureTask1,
    fixtureTask2,
  ])
  const setTask = useCallback((id, newTask) => {
    setTasks(tasks => tasks.map(oldTask => {
      if (oldTask.id === id) {
        return newTask
      }
      return oldTask
    }))
  }, [])

  return (
    <>
      <div key='raw'>
        <h2 key='title'>Raw</h2>
        <TodoList key='list'>
          {tasks.map(task => (
            <TodoItem key={task.id} task={task} setTask={setTask}/>
          ))}
        </TodoList>
        <TodoMaker key='maker' setTasks={setTasks}/>
      </div>

      <div key='root'>
        <h2 key='title'>Root</h2>
        <RootTodoList key='list'>
          {tasks.map(task => (
            <RootTodoItem key={`root-${task.id}`} task={task} setTask={setTask}/>
          ))}
        </RootTodoList>
        <RootTodoMaker key='maker' setTasks={setTasks}/>
      </div>

      <div key='portal'>
        <h2 key='title'>Portal</h2>
        <PortalTodoList key='list'>
          {tasks.map(task => (
            <PortalTodoItem key={`portal-${task.id}`} task={task} setTask={setTask}/>
          ))}
        </PortalTodoList>
        <PortalTodoMaker key='maker' setTasks={setTasks}/>
      </div>

    </>
  )
}
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <App/>
);

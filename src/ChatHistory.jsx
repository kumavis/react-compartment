import React, { useMemo } from "react";

const ChatLogEntry = ({ message }) => {
  return (
    <p>{message}</p>
  )
}

export const ChatHistory = ({ chatLog = [] }) => {
  // const renderId = Math.random().toString(36).substring(7)
  // const randomId = useMemo(() => {
  //   return Math.random().toString(36).substring(7);
  // }, [])
  // console.log(randomId, renderId, 'History render', { chatLog })

  return (
    <>
      {chatLog.map((message, index) => (
        <ChatLogEntry key={index} message={message}/>
      ))}
    </>
  )
}


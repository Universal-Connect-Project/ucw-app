import config from '../config'

const levels = {
  debug: -1,
  trace: 0,
  info: 1,
  warning: 2,
  error: 3
}

function startDoc() {
  return {
    Level: 'trace',
    Component: config.Component,
    Env: config.Env ?? 'dev',
    Request: {},
    '@timestamp': new Date().toISOString()
  }
}

function logDoc(doc) {
  if (
    levels[config.LogLevel?.toLowerCase()] > levels[doc.Level.toLowerCase()] ||
    process.env.NODE_ENV === 'test'
  ) {
    return
  }
  if (
    config.Env === 'dev'
  ) {
    console.log(doc)
  } else {
    console.log(JSON.stringify(doc))
  }
}

function logMessage(message, level, data, isError) {
  const doc = startDoc()
  doc.Level = level ?? doc.Level
  doc.Message = message
  if (isError != null && data != null) {
    doc.Error = { message: data.message ?? data, stack: data.stack }
  } else {
    doc.Data = data
  }
  logDoc(doc)
}

export function error(message, error) {
  logMessage(message, 'error', error, true)
}
export function info(message, data) {
  logMessage(message, 'info', data)
}
export function warning(message, data) {
  logMessage(message, 'warning', data)
}
export function trace(message, data) {
  logMessage(message, 'trace', data)
}
export function debug(message, data) {
  logMessage(message, 'debug', data)
}

import axios from 'axios'

const isDev = import.meta.env.DEV
const hostname = window.location.hostname

export const api = axios.create({
  baseURL: isDev ? `http://${hostname}:3333` : '/api',
})

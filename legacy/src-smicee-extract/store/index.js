import { createStore } from 'vuex'
import activityLog      from './activityLog'
import approvalChain    from './approvalChain'
import auth             from './auth'
import chat             from './chat'
import client           from './client'
import department       from './department'
import designation      from './designation'
import employee         from './employee'
import eod              from './eod'
import notification     from './notification'
import organization     from './organization'
import permission       from './permission'
import project          from './project'
import projectType      from './projectType'
import punch            from './punch'
import resetPassword    from './resetPassword'
import sidebar          from './sidebar'
import task             from './task'
import vendor           from './vendor'

export default createStore({
  strict: import.meta.env.DEV,
  modules: {
    activityLog,
    approvalChain,
    auth,
    chat,
    client,
    department,
    designation,
    employee,
    eod,
    notification,
    organization,
    permission,
    project,
    projectType,
    punch,
    resetPassword,
    sidebar,
    task,
    vendor,
  },
})

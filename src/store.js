import { createStore } from 'vuex'

import { FileSystemDriver } from './FileSystemDriver'

import { fnRandomString, fnSaveFile } from './lib'

// NOTE: Константы
export const DATABASE_PATH = "js-sandbox-database.json"
export const DATABASE_UPDATE_TIMEOUT = 30000

// Create a new store instance.
export default createStore({
    state () {
        return {
            oStructure: {
                table: {
                    name: {
                        label: "Название",
                        type: "text",
                    },
                    content_css: {
                        label: "css",
                    },
                    content_js: {
                        label: "js",
                    },
                    content_html: {
                        label: "html",
                    },
                }
            },
            oEditWindow: {
                table:{
                    window_show: false,
                    edit_item: {},
                }
            },
            oDatabase: {
                table: {
                    last_index: 0,
                    data: [],
                    selection_id: null,
                    selection_item: null,
                },
            },
            oForms: {
                table: {
                    name: "",
                }
            },

            bShowSaveToast: false,

            bShowRepoWindow: true,

            aDefaultRepoList: [
                { type:"localstorage", name: "Локальное хранилище" }
            ],
            aReposList: [],
            iSelectedRepoIndex: null,

            sMode: "tasks",
        }
    },
    mutations: {
        fnReposRemove(state, iIndex) {
            state.aReposList.splice(iIndex-state.aDefaultRepoList.length, 1)
            localStorage.setItem('aReposList', JSON.stringify(state.aReposList))
        },
        fnReposSelect(state, iIndex) {
            state.iSelectedRepoIndex = iIndex
        },
        fnReposClean(state) {
            state.aReposList = []
            localStorage.setItem('aReposList', JSON.stringify(state.aReposList))
        },
        fnReposUpdate(state, { iIndex, oObj }) {
            if (iIndex==-1) {
                state.aReposList.push(oObj)
            } else {
                state.aReposList.splice(iIndex-state.aDefaultRepoList.length, 1, oObj)
            }
            localStorage.setItem('aReposList', JSON.stringify(state.aReposList))
        },
        fnLoadRepos(state) {
            try { 
                state.aReposList = JSON.parse(localStorage.getItem('aReposList') || '[]')
            } catch(_) {

            }
        },

        fnUpdateDatabase(state, oDatabase) {
            state.oDatabase = oDatabase
        },
        fnUpdateRepos(state, aReposList) {
            state.aReposList = aReposList
        },
        fnUpdateField(state, { sTable, sField, sV }) {
            var oT = state.oDatabase[sTable]
            var oI = oT.selection_item[sField] = sV
        },

        fnHideRepoWindow(state) {
            state.bShowRepoWindow = false
        },
        fnShowRepoWindow(state) {
            state.bShowRepoWindow = true
        },
        fnShowLoader(state) {
            state.bShowLoader = true
        },
        fnHideLoader(state) {
            state.bShowLoader = false
        },

        fnExportDatabase({ commit, state, dispatch, getters }) {
            fnSaveFile('tasks-database', JSON.stringify(state.oDatabase, null, 4))
        },
        fnImportDatabase({ commit, state, dispatch, getters }, sData) {
            commit('fnUpdateDatabase', JSON.parse(sData))
        },

        fnExportRepos({ commit, state, dispatch, getters }) {
            fnSaveFile('tasks-repos', JSON.stringify(state.aReposList, null, 4))
        },
        fnImportRepos({ commit, state, dispatch, getters }, sData) {
            commit('fnUpdateRepos', JSON.parse(sData))
        },

        fnUpdateFormVar(state, { sFormName, sFieldName, mV }) {
            state.oForms[sFormName][sFieldName] = mV
        },
        fnUpdateDatabaseVar(state, { sTableName, sVarName, mV }) {
            state.oDatabase[sTableName][sVarName] = mV
        },
        fnUpdateVar(state, { sName, sV }) {
            state[sName] = sV
        },
        fnUpdateFilter(state, { sTableName, sName, sV }) {
            state.oDatabase[sTableName].filter[sName] = sV
        },
        fnHideEditWindow(state, sFormName) {
            state.oEditWindow[sFormName].window_show = false
        },
        fnShowEditWindow(state, { sFormName, oItem }) {
            state.oEditWindow[sFormName].window_show = true
            state.oEditWindow[sFormName].edit_item = oItem
            for (var sN in state.oForms[sFormName]) {
                if (sN in oItem) {
                    state.oForms[sFormName][sN] = oItem[sN]
                } else {
                    state.oForms[sFormName][sN] = ""
                }
            }
        },
        fnEditWindowSave(state, { sTableName, sFormName }) {
            for (var sN in state.oForms[sFormName]) {
                state.oEditWindow[sFormName].edit_item[sN] = state.oForms[sFormName][sN]
            }
            if (!state.oEditWindow[sFormName].edit_item.id) {
                state.oEditWindow[sFormName].edit_item.id = ++state.oDatabase[sTableName][`last_index`]
                state.oDatabase[sTableName][`data`].push(state.oEditWindow[sFormName].edit_item)
            }
        },
        fnRemoveFromTable(state, { sTableName, oItem }) {
            state.oDatabase[sTableName][`data`] = state.oDatabase[sTableName][`data`].filter((oI) => oI.id != oItem.id)
        }
    },
    actions: {
        fnGetFieldValue: ({ state, getters }) => (sFormName, sFieldName) => {
            return getters.fnGetFieldValue(sFormName, sFieldName)
        },
        fnPrepareRepo({ commit, state, dispatch, getters }) {
            commit('fnHideRepoWindow')
            FileSystemDriver.fnInit(getters.oCurrentRepo)
            dispatch('fnLoadDatabase')
        },
        fnSaveDatabase({ commit, state }) {
            return FileSystemDriver.fnWriteFileJSON(DATABASE_PATH, state.oDatabase)
                .catch(() => {
                    FileSystemDriver.fnReadFile(DATABASE_PATH)
                        .then(() => {
                            return FileSystemDriver.fnWriteFileJSON(DATABASE_PATH, state.oDatabase)
                        })
                })
        },
        fnLoadDatabase({ commit, state }) {
            commit('fnShowLoader')
            FileSystemDriver
                .fnReadFileJSON(DATABASE_PATH)
                .then((mData) => {
                    if (!mData) throw "Cannot destructure property"
                    commit('fnUpdateDatabase', mData)
                    // commit('fnUpdateDatabase', mData=demo_database)
                    commit('fnHideLoader')
                })
                .catch((oE) => {
                    if ((oE+"").match(/Cannot destructure property/)
                        || (oE+"").match(/Not Found/)) {
                        FileSystemDriver.fnWriteFileJSON(DATABASE_PATH, state.oDatabase)
                            .then(() => {
                                FileSystemDriver
                                    .fnReadFileJSON(DATABASE_PATH)
                                    .then((mData) => { 
                                        commit('fnUpdateDatabase', mData)
                                        commit('fnHideLoader')
                                    })
                            })
                    }
                })
        },
    },
    getters: {
        fnGetFieldValue: (state) => (sFormName, sFieldName) => {
            return state.oForms[sFormName][sFieldName]
        },
        aReposList(state) {
            return state.aDefaultRepoList.concat(state.aReposList)
        },
        oCurrentRepo(state, getters) {
            return getters.aReposList[state.iSelectedRepoIndex]
        },
    }
})
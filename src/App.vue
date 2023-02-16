<template>
  <div class="wrapper">
    <div class="left-panel">
      <button v-for="(oMenuItem, iI) in aMenu" :key="iI" class="btn" @click="fnClickLeftMenu(oMenuItem)" :title="oMenuItem.title"><i :class="'bi '+oMenuItem.icon"></i></button>
      <hr />
      <button class="btn" title="Экспортировать" @click="fnExport"><i class="bi bi-box-arrow-down"></i></button>
      <button class="btn btn-import" title="Импортировать"><i class="bi bi-box-arrow-in-up"></i><label><input type="file" ref="file_selector" @change="fnFileImportChange" /></label></button>
    </div>
    <div class="files-panel">
      <list :form_name="'table'" :table_name="'table'" :filter_field="'name'" :default_item="oDefaultItem" @clickitem="fnListItemClick">
        <template v-slot:default="p">
          {{ p.oItem.name }}
        </template>
      </list>
    </div>
    <template v-if="oSelectedFile">
      <div class="editor-panel">
        <ul class="nav nav-tabs">
          <li class="nav-item" role="presentation">
            <button :class="'nav-link '+(sMode=='js' ? 'active' : '')" @click="sMode='js'">JS</button>
          </li>
          <li class="nav-item" role="presentation">
            <button :class="'nav-link '+(sMode=='css' ? 'active' : '')" @click="sMode='css'">CSS</button>
          </li>
          <li class="nav-item" role="presentation">
            <button :class="'nav-link '+(sMode=='html' ? 'active' : '')" @click="sMode='html'">HTML</button>
          </li>
        </ul>
        <template v-if="sMode == 'js'">
          <v-ace-editor
            v-model:value="sCodeJS"
            lang="javascript"
            theme="chrome"
            style="height: 100%" 
          />
        </template>
        <template v-if="sMode == 'css'">
          <v-ace-editor
            v-model:value="sCodeCSS"
            lang="css"
            theme="chrome"
            style="height: 100%" 
          />
        </template>
        <template v-if="sMode == 'html'">
          <v-ace-editor
            v-model:value="sCodeHTML"
            lang="html"
            theme="chrome"
            style="height: 100%" 
          />
        </template>
      </div>
      <div class="preview-panel">
        <div class="top-iframe-panel">
          <div class="btn" @click="fnRefresh"><i class="bi bi-arrow-repeat"></i></div>
        </div>
        <iframe :src="sIframeSRC" ref="iframe" />
      </div>
    </template>
  </div>

  <repo_window />
  <saved_toast />

  <loader/>
</template>

<script>

// import 'ace-builds/src-noconflict/mode-json';
// import 'ace-builds/src-noconflict/mode-javascript';
// import 'ace-builds/src-noconflict/mode-css';
// import 'ace-builds/src-noconflict/mode-html';
// import 'ace-builds/src-noconflict/theme-chrome';

import ace from 'ace-builds';

import modeJsUrl from 'ace-builds/src-noconflict/mode-javascript?url';
ace.config.setModuleUrl('ace/mode/javascript', modeJsUrl);

import modeCssUrl from 'ace-builds/src-noconflict/mode-css?url';
ace.config.setModuleUrl('ace/mode/css', modeCssUrl);

import modeHTMLUrl from 'ace-builds/src-noconflict/mode-html?url';
ace.config.setModuleUrl('ace/mode/html', modeHTMLUrl);

import themeChromeUrl from 'ace-builds/src-noconflict/theme-chrome?url';
ace.config.setModuleUrl('ace/theme/chrome', themeChromeUrl);

import { VAceEditor } from 'vue3-ace-editor';

import dropdown from "./components/dropdown.vue"
import repo_window from "./components/repo_window.vue"
import saved_toast from "./components/saved_toast.vue"
import loader from './components/loader.vue'

import list from './components/list.vue'

import { mapMutations, mapState, mapActions, mapGetters } from 'vuex'
import { a, cc } from "./lib"

export default {
  name: 'App',
  
  components: {
    repo_window,
    saved_toast,
    loader,
    list,
    VAceEditor
  },

  computed: {
    ...mapState(a`bForceUpdateIframe`),
    ...cc(`bShowRepoWindow bShowSaveToast`),
    oSelectedFile() { return this.$store.state.oDatabase['table'][`selection_item`] },
    sCodeCSS: {
      get() { return this.oSelectedFile.content_css },
      set(sV) { this.$store.commit('fnUpdateField', { sTable: 'table', sField: 'content_css', sV }); }
    },
    sCodeJS: {
      get() { return this.oSelectedFile.content_js },
      set(sV) { this.$store.commit('fnUpdateField', { sTable: 'table', sField: 'content_js', sV }); }
    },
    sCodeHTML: {
      get() { return this.oSelectedFile.content_html },
      set(sV) { this.$store.commit('fnUpdateField', { sTable: 'table', sTable: 'table', sField: 'content_html', sV });}
    },
    sIframeSRC() {
      // if (!this.oSelectedFile || !this.$refs.iframe) return "about:blank";
      var sHTML = this.sCodeHTML+`<s`+`tyle>${this.sCodeCSS}</st`+`yle><sc`+`ript>${this.sCodeJS}</sc`+`ript>`
      var oB = new Blob([sHTML], {type: "text/html"});
      return window.URL.createObjectURL(oB)+"";
    }
  },

  data() {
    return {
      sMode: "js",

      oDefaultItem: {
        content_css: "body, html { padding: 0px; margin: 0px; }",
        content_js: "document.writeln('<h1>demo</h1>')",
        content_html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
</head>
<body>
    
</body>
</html>`,
      },

      aMenu: [
        { id: "repo-window", title: "Выбрать репозиторий", icon: "bi-person-fill" },
        { id: "save", title: "Сохранить", icon: "bi-arrow-up-square" },
      ],
    }
  },

  methods: {
    ...mapMutations(a`fnLoadRepos`),
    ...mapActions(a`fnSaveDatabase fnImportDatabase fnExportDatabase`),
    fnClickLeftMenu(oItem) {
      if (oItem.id == "repo-window") {
        this.bShowRepoWindow = true
      }
      if (oItem.id == "save") {
        this.fnSaveAll()
      }
    },
    fnSaveAll() {
      this.fnSaveDatabase()
      this.bShowSaveToast = true
    },
    fnExport() {
      this.fnExportDatabase()
    },
    fnImport() {
      let oFile = this.$refs.file_selector.files[0];
      let reader = new FileReader();
      var oThis = this

      reader.readAsText(oFile);

      reader.onload = function() {
        oThis.fnImportDatabase(reader.result)
      };

      reader.onerror = function() {
        console.error(reader.error);
      };
    },
    fnFileImportChange() {
      this.fnImport()
    },
    fnRefresh() {
      this.$refs.iframe.contentWindow.location.reload()
    }
  },
  created() {
    var oThis = this

    this.fnLoadRepos()

    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.keyCode === 83) {
          e.preventDefault();
          oThis.fnSaveAll()
      }
    });
  }
}
</script>

<style>

</style>

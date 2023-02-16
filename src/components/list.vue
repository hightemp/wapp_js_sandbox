<template>
    <div class="list_top-panel">
        <input type="text" class="form-control" v-model="sFilter"  />
        <dropdown :items="aDropdownMenu" @clickitem="fnDropdownMenuItemClick" />
    </div>
    <div class="list_wrapper">
        <div class="list-group">
            <a v-for="oItem in oItems" :key="oItem"
                href="#" :class="'list-group-item list-group-item-action '+(oItem.id == sSelectedID ? 'active' :'')" @click="(oE) => fnItemClick(oE, oItem)">
                <slot v-bind:oItem="oItem"></slot>
            </a>
        </div>
    </div>
    <edit_window title="Редактирование" :form_name="form_name" :table_name="table_name" />
</template>

<script>

import { mapMutations, mapState, mapActions, mapGetters } from 'vuex'
import { a, cc } from "../lib"

import dropdown from "./dropdown.vue"
import edit_window from "./edit_window.vue"

export default {
    props: ['form_name', 'table_name', 'filter_field', 'default_item'],
    emits: ['clickitem'],

    components: {
        dropdown,
        edit_window
    },

    computed: {
        sSelectedID: {
            get() {
                return this.$store.state.oDatabase[this.table_name][`selection_id`]
            },
            set(mV) {
                this.$store.commit('fnUpdateDatabaseVar', { sTableName: this.table_name, sVarName: `selection_id`, mV })
            }
        },
        oSelectedItem: {
            get() {
                return this.$store.state.oDatabase[this.table_name][`selection_item`]
            },
            set(mV) {
                this.$store.commit('fnUpdateDatabaseVar', { sTableName: this.table_name, sVarName: `selection_item`, mV })
            }
        },
        oItems() {
            var aD = this.$store.state.oDatabase[this.table_name][`data`]
            if (this.filter_field) {
                aD = aD.filter((oI) => oI[this.filter_field] && ~oI[this.filter_field].indexOf(this.sFilter))
            }
            return aD
        }
    },

    data() {
        return {
            sFilter: "",
            // oSelectedItem: null,

            aDropdownMenu: [
                { id:"add", title:'<i class="bi bi-plus-lg"></i> Добавить' },
                { id:"edit", title:'<i class="bi bi-pencil"></i> Редактировать' },
                { id:"delete", title:'<i class="bi bi-trash"></i> Удалить' },
            ],
        }
    },

    methods: {
        ...mapMutations(a`fnShowEditWindow fnRemoveFromTable`),
        fnItemClick(oE, oItem) {
            this.sSelectedID = oItem.id
            this.oSelectedItem = oItem
            this.$emit('clickitem', oE)
        },
        fnDropdownMenuItemClick(oItem) {
            if (oItem.id == "add") {
                this.fnShowEditWindow({ sFormName: this.form_name, oItem: this.default_item })
            }
            if (oItem.id == "edit") {
                if (!this.oSelectedItem) {
                    alert("Нужно выбрать");
                }
                this.fnShowEditWindow({ sFormName: this.form_name, oItem: this.oSelectedItem })
            }
            if (oItem.id == "delete") {
                this.fnRemoveFromTable({ sTableName: this.table_name, oItem: this.oSelectedItem })
            }
        }
    }
}
</script>

<style>
.list_top-panel {
    display: flex;
}

.list_wrapper {
    height: 100%;
}
</style>
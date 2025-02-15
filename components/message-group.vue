<template>
  <draggable :class="'content-editor-draggable-' + message.type">
    <v-sheet
      elevation="2"
      rounded
      class="mx-4 my-8 pa-3 content-editor-draggable"
      :class="'content-editor-draggable-' + message.type + '-message-bg'"
    >
      <v-container>
        <v-row cols="12">
          <v-col v-if="deletable" class="content-editor-draggable-sidebar">
            <v-icon
              class="content-editor-draggable-handle"
            >
              mdi-drag
            </v-icon>
            <v-checkbox v-model="checked" />
            <v-tooltip v-if="checked" bottom>
              <template #activator="{ on, attrs }">
                <v-hover v-slot="{ hover }">
                  <v-icon
                    :color="hover ? 'red' : null"
                    v-bind="attrs"
                    v-on="on"
                    @click="deleteSelected"
                  >
                    mdi-delete
                  </v-icon>
                </v-hover>
              </template>
              <span>Delete all {{ selected.length }} selected messages</span>
            </v-tooltip>
          </v-col>

          <v-col class="content-editor-draggable-content">
            #{{ message.number }}
            <div class="content-editor-draggable-header">
              <v-textarea
                :value="message.logic"
                class="content-editor-draggable-logic"
                filled
                rounded
                :disabled="disabled"
                single-line
                full-width
                rows="1"
                auto-grow
                background-color="purple lighten-3"
                label="Flow control logic"
                @change="changeMessage({ element: 'logic', to: $event })"
              >
                <template #prepend>
                  <v-menu
                    v-if="isNestable"
                    bottom
                    offset-y
                  >
                    <template #activator="menuActivator">
                      <v-avatar
                        v-bind="menuActivator.attrs"
                        v-on="menuActivator.on"
                      >
                        <v-icon
                          size="36"
                          color="purple lighten-3"
                        >
                          mdi-arrow-decision
                        </v-icon>
                      </v-avatar>
                    </template>
                    <v-list>
                      <v-list-item v-for="(item, i) in nestableMenu" :key="i" @click="item.action">
                        <v-list-item-title v-text="item.title" />
                      </v-list-item>
                    </v-list>
                  </v-menu>

                  <sender-selector
                    v-else
                    :disabled="disabled"
                    :message="message"
                    :npcs-available-in-this-phase="npcsAvailableInThisPhase"
                  />
                </template>

                <template #append>
                  <v-tooltip bottom>
                    <template #activator="{on, attrs}">
                      <v-hover v-slot="{hover}">
                        <v-icon
                          v-bind="attrs"
                          class="ml-2"
                          :color="hover ? 'black' : 'grey lighten-1'"
                          v-on="on"
                          @click="codegen"
                        >
                          mdi-code-greater-than
                        </v-icon>
                      </v-hover>
                    </template>
                    <span>Auto-generate CDM code</span>
                  </v-tooltip>
                </template>

                <template #append-outer>
                  <v-tooltip bottom>
                    <template #activator="{ on, attrs }">
                      <v-hover v-slot="{ hover }">
                        <v-icon
                          v-bind="attrs"
                          class="ml-2"
                          :color="hover ? 'blue' : 'grey lighten-1'"
                          v-on="on"
                          @click="
                            addMessage({ after: message, duplicate: true })
                          "
                        >
                          mdi-content-duplicate
                        </v-icon>
                      </v-hover>
                    </template>
                    <span> Duplicate </span>
                  </v-tooltip>

                  <v-tooltip v-if="deletable" bottom>
                    <template #activator="{ on, attrs }">
                      <v-hover v-slot="{ hover }">
                        <v-icon
                          v-bind="attrs"
                          class="ml-2"
                          :color="hover ? 'red' : 'grey lighten-1'"
                          v-on="on"
                          @click="deleteMessage(message)"
                        >
                          mdi-delete
                        </v-icon>
                      </v-hover>
                    </template>
                    <span> Delete </span>
                  </v-tooltip>
                </template>
              </v-textarea>

              <div
                v-show="null !== message.code"
                class="my-3"
              >
                <prism-editor
                  v-model="code"
                  :readonly="disabled"
                  :highlight="highlighter"
                  class="content-editor-draggable-code"
                  @blur="changeMessage({element: 'code', to: code})"
                />
              </div>
            </div>

            <div class="d-flex">
              <type-selector
                v-if="!isNestable || children.length < 2"
                :disabled="disabled"
                :message="message"
                :children="children"
                :phase="phase"
              />

              <v-textarea
                v-show="null !== message.comment"
                ref="commentField"
                :value="message.comment"
                class="content-editor-draggable-comment mx-5"
                outlined
                rounded
                single-line
                full-width
                rows="1"
                auto-grow
                background-color="yellow lighten-3"
                label="Comment"
                @change="changeMessage({ element: 'comment', to: $event })"
              >
                <template #append-outer>
                  <v-tooltip bottom>
                    <template #activator="{on, attrs}">
                      <v-hover v-slot="{ hover }">
                        <v-icon v-bind="attrs" :color="hover ? 'red' : 'grey lighten-1'" v-on="on" @click="deleteComment">
                          mdi-delete
                        </v-icon>
                      </v-hover>
                    </template>
                    <span>Delete comment</span>
                  </v-tooltip>
                </template>
              </v-textarea>
              <v-btn
                v-if="null === message.comment"
                class="mx-5"
                @click="addComment"
              >
                <v-icon left color="yellow darken-3">
                  mdi-pencil
                </v-icon>
                Add a comment
              </v-btn>
            </div>

            <template v-if="enableFileUpload">
              <v-file-input
                v-model="file"
                :label="'Pick ' + message.type + ' file for upload'"
                :accept="acceptedFiles"
                :disabled="disabled"
                @change="createBlobURL"
              />
              <!-- <v-textarea
                :value="message.attachment"
                full-width
                auto-grow
                rows="2"
                label="or enter a URL directly"
                @change="changeMessage({element: 'attachment', to: $event})"
              /> -->
              <h4 v-if="preview">
                PREVIEW - press button to upload
              </h4>
              <div v-if="file !== null">
                <v-btn
                  :loading="loading"
                  :disabled="loading"
                  color="blue-grey"
                  class="ma-2 white--text"
                  fab
                  @click="upload"
                >
                  <v-icon dark>
                    mdi-cloud-upload
                  </v-icon>
                </v-btn>

                <v-alert
                  v-if="uploadFailedAlert"
                  v-model="uploadFailedAlert.show"
                  type="error"
                  dismissible
                >
                  There was a problem uploading the file:
                  {{ uploadFailedAlert.errorMessage }}
                </v-alert>
              </div>

              <div v-if="message.type === 'audio'">
                <audio controls>
                  <source :src="url || message.attachment">
                </audio>
              </div>
              <div v-else-if="message.type === 'video'">
                <video
                  controls
                  :src="url || message.attachment"
                  type="video/mp4"
                />
              </div>
              <div v-else-if="message.type === 'image'">
                <v-img
                  max-width="500px"
                  :src="url || message.attachment"
                />
              </div>

              <a v-if="message.attachment" target="_blank" :href="message.attachment">Download link</a>
            </template>

            <v-textarea
              v-if="showTextField"
              :value="message.text"
              full-width
              auto-grow
              rows="2"
              label="Message text"
              :disabled="disabled"
              @change="changeMessage({ element: 'text', to: $event })"
            />

            <container
              v-if="isNestable"
              group-name="episode-messages"
              drag-handle-selector=".content-editor-draggable-handle"
              :get-child-payload="(index) => {
                const msg = children[index]
                const {id, number} = msg
                setDraggedMessageInfo({id, number, index})
              }"
              @drag-start="
                setDragSource({
                  ...$event,
                  dragSource: message,
                  fromPhase: message.section_id,
                  fromParentIsNull: false
                })
              "
              @drop="
                moveMessage({
                  ...$event,
                  dragTarget: message,
                  toPhase: message.section_id,
                  toParentIsNull: false
                })
              "
            >
              <lazy-message-group
                v-for="submessage in children"
                :key="submessage.id"
                :all-messages-in-this-phase="allMessagesInThisPhase"
                :npcs-available-in-this-phase="npcsAvailableInThisPhase"
                :message="submessage"
                :phase="phase"
                :deletable="children.length > 1"
                :course-name="courseName"
                :disabled="disabled"
              />
            </container>
          </v-col>
          <!-- content-editor-draggable-content -->
        </v-row>
        <v-btn
          fab
          :disabled="disabled"
          color="green"
          class="content-editor-draggable-add"
          @click="addMessage({ after: message })"
        >
          <v-icon color="white">
            mdi-plus
          </v-icon>
        </v-btn>
        <v-menu offset-x left>
          <template #activator="{on, attrs}">
            <v-btn
              fab
              x-small
              :disabled="disabled"
              class="content-editor-draggable-add-menu"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-dots-horizontal</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="item in addMenu" :key="item.title" @click="item.action(message, message.parent, message.section_id)">
              <v-list-item-title v-text="item.title" />
            </v-list-item>
          </v-list>
        </v-menu>
        <v-dialog v-model="addMessagesFromFlowTextDialogVisible" max-width="80%">
          <v-card elevation="7">
            <v-card-title v-text="'Add messages from flow text script'" />
            <v-card-text>
              <v-textarea v-model="flowText" outlined clearable auto-grow autofocus />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="addMessagesFromFlowTextDialogVisible = false">
                Cancel
              </v-btn>
              <v-btn color="green" @click="addMessagesFromFlowText">
                Create Messages
              </v-btn>
              <v-spacer />
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-sheet>
  </draggable>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'
import { Container, Draggable } from 'vue-smooth-dnd'
// import Prism Editor
import { PrismEditor } from 'vue-prism-editor'
import 'vue-prism-editor/dist/prismeditor.min.css' // import the styles somewhere

// import highlighting library (you can use any library you want just return html string)
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-crystal'
import 'prismjs/themes/prism-tomorrow.css'

export default {
  components: {
    Container,
    Draggable,
    PrismEditor,
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
    phase: {
      type: Object,
      required: true,
    },
    allMessagesInThisPhase: {
      type: Array,
      required: true,
    },
    npcsAvailableInThisPhase: {
      type: Array,
      required: true,
    },
    deletable: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: true,
    },
    courseName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      file: null,
      uploadFailedAlert: null,
      url: null,
      preview: false,
      addMessagesFromFlowTextDialogVisible: false,
      addMessagesContext: null,
      flowText: '',
      code: this.message.code || '',
      addMenu: [
        { title: 'Add messages from flow text script', action: this.showAddMessagesFromFlowTextDialog },
      ],
      nestableMenu: [
        { title: 'Explode this block so all child messages become independent', action: this.explodeNestable },
        { title: 'Restore message order in this block (click this when encountering Drag&Drop malfunction)', action: this.restoreNumbers },
      ],
      acceptedFiles: {
        image: 'image/png, image/jpeg, image/gif',
        audio: 'audio/x-mpeg',
        video: 'video/mp4',
      },
    }
  },
  computed: {
    ...mapState([
      'selected',
    ]),
    checked: {
      get() {
        return this.selected.includes(this.message)
      },
      set(v) {
        if (v) {
          this.select(this.message)
        } else {
          this.unselect(this.message)
        }
      },
    },
    children() {
      return this.allMessagesInThisPhase.filter(m => m.parent === this.message.id)
    },
    enableFileUpload() {
      return ['audio', 'video', 'image'].includes(this.message.type)
    },
    isNestable() {
      return this.message.type === 'nestable'
    },
    showTextField() {
      return ['text', 'image', 'audio', 'video'].includes(this.message.type)
    },
  },
  watch: {
    loader() {
      const l = this.loader
      this[l] = !this[l]

      setTimeout(() => (this[l] = false), 3000)

      this.loader = null
    },
  },
  methods: {
    ...mapMutations([
      'setDraggedMessageInfo',
      'setDragSource',
      'select',
      'unselect',
      'clearSelection',
    ]),
    ...mapActions([
      'moveMessage',
    ]),
    showAddMessagesFromFlowTextDialog(previousMessage, parentId, phaseId) {
      this.addMessagesContext = { previousMessage, parentId, phaseId }
      this.addMessagesFromFlowTextDialogVisible = true
    },
    async addMessagesFromFlowText() {
      const ctx = this.addMessagesContext
      if (ctx) {
        const { previousMessage, parentId, phaseId } = ctx
        const firstNumber = previousMessage.number + 1
        const flowText = this.flowText
        const matches = Array.from(flowText.matchAll(/(?<=^|\n)\s*(nick|alicia|vz|victoria|(?:the )?professor|(?:dr\.? )?cam(arena)?)\s*(?=\n)/gi, true))
        const senderAliases = {
          Professor: ['the professor', 'professor', 'camarena', 'dr camarena', 'dr. camarena'],
          Alicia: ['alicia'],
          Nick: ['nick'],
          VZ: ['vz', 'victoria'],
        }
        const senderIds = Object.keys(senderAliases)
        const messages = []
        let parent = parentId
        let logic
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i]
          if (messages.length === 0) {
            logic = '*** THIS MESSAGE BLOCK WAS CREATED FROM A SCRIPT ***\n*** PLEASE GO THROUGH THE MESSAGES AND CORRECT THEM ***\n\n' +
                    flowText.substr(0, match.index)
            const { data: { addMessage: { id } } } = await this.$apollo.mutate({
              mutation: require('~/graphql/AddMessage'),
              variables: {
                phaseId,
                number: firstNumber,
                logic,
                type: 'nestable',
                parent: parentId,
                parentIsNull: parentId === null,
              },
            })
            parent = id
          }
          const alias = match[1].toLowerCase()
          let sender = senderIds.find(id => senderAliases[id].includes(alias))
          const unknownSenderHint = '*** ' + 'THIS MESSAGE WAS MARKED AS COMING FROM "' + match[1] + '" IN THE SCRIPT - PLEASE SELECT THE CORRECT SENDER MANUALLY, THEN ADD FLOW CONTROL LOGIC!' + ' ***'
          logic = sender ? '' : unknownSenderHint
          if (!sender) { sender = 'Professor' }
          const nextIndex = i + 1
          let text
          const begin = match.index + match[0].length
          if (nextIndex < matches.length) {
            const end = matches[nextIndex].index
            const len = end - begin
            text = flowText.substr(begin, len)
          } else {
            text = flowText.substr(begin)
          }
          text = text.trim().replaceAll('\n', ' ')
          // console.log('Adding message #' + nextIndex + ' from ' + sender + ', logic: ' + logic, text)
          messages.push({
            sender_id: sender,
            logic,
            type: 'text',
            text,
            attachment: null,
            section_id: phaseId,
            parent,
            number: nextIndex,
          })
        }
        await this.$apollo.mutate({
          mutation: require('~/graphql/AddMessages'),
          variables: {
            messages,
            phaseId,
            parent,
            parentIsNull: parent === null,
            firstNumber,
            numberOfMessages: messages.length,
          },
        })
      }
      this.addMessagesFromFlowTextDialogVisible = false
    },
    async upload() {
      this.loading = true
      const fd = new FormData()
      fd.append('image', this.file, this.file.name)
      try {
        const result = await this.$axios.$post('https://' + process.env.NUXT_ENV_PROC_URL + '/content-editor/upload', fd, { params: { c: this.courseName } })
        this.loading = false
        if (result.success) {
          this.url = result.url
          this.preview = false
          await this.$apollo.mutate({
            mutation: require('~/graphql/UpdateMessageAttachment'),
            variables: {
              id: this.message.id,
              attachment: result.url,
            },
          })
        } else {
          this.uploadFailedAlert = {
            show: true,
            errorMessage: result.msg,
          }
        }
      } catch (ex) {
        this.uploadFailedAlert = {
          show: true,
          errorMessage: JSON.stringify(ex),
        }
      }
    },
    createBlobURL(file) {
      this.url = file ? URL.createObjectURL(file) : ''
      this.preview = !!file
    },
    // updateEpisodeEditStateToSpecsIfNull (editField) {
    //   if (!('state' in editField)) {
    //     this.$apollo.mutate({
    //       mutation: require('~/graphql/UpdateEpisodeEditState'),
    //       variables: {
    //         id: this.messageId,
    //         state: 'specs'
    //       }
    //     })
    //   }
    // },
    async deleteMessage() {
      if (confirm('Are you sure you want to delete this message?')) {
        // this.updateEpisodeEditStateToSpecsIfNull(editField)

        // Optimistic
        const data = this.phase
        let index = 0
        data.prompts.every((prompt, idx) => {
          index = idx
          if (prompt.id === this.message.id) {
            return false
          }
          return true
        })
        data.prompts.splice(index, 1)

        const parent = this.message.parent
        const variables = { parent, parentIsNull: parent === null }
        await this.$db.delete({ message: true }, 'phase', this.message, this.message.section_id, variables)
      }
    },
    async deleteComment() {
      if (this.message.comment.trim() === '' ||
        confirm('Are you sure you want to delete the comment section for this message?\nThe text will be irreversibly erased!')) {
        await this.changeMessage({ element: 'comment', to: null })
      }
    },
    async addComment() {
      await this.changeMessage({ element: 'comment', to: '' })
      // TODO: Focus the comment field
      // await this.$nextTick()
      // document.getElementsByClassName('content-editor-draggable-comment')[0].focus()
    },
    async changeMessage({ element, to }) {
      const variables = {
        id: this.message.id,
      }
      variables[element] = to
      await this.$apollo.mutate({
        mutation: require('~/graphql/UpdateMessage' + element.toCamelCase()),
        variables,
      })
    },
    async addMessage({ after, duplicate }) {
      let variables = {}
      if (duplicate) {
        variables = { ...after }
        delete variables.id
        delete variables.section_id
        delete variables.__typename
      } else {
        variables.parent = after.parent
      }
      variables.parentIsNull = variables.parent === null
      variables.phaseId = after.section_id
      variables.number = after.number + 1

      // Optimistic
      const data = this.phase
      const index = variables.number - 1
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      data.prompts.splice(
        index,
        0,
        {
          id: fakeId,
          attachment: duplicate ? after.attachment : null,
          logic: duplicate ? after.logic : '',
          number: variables.number,
          parent: variables.parent,
          section_id: after.section_id,
          sender_id: after.sender_id,
          text: duplicate ? after.text : '',
          type: duplicate ? after.type : 'text',
        }
      )
      data.prompts.sort((a, b) => parseFloat(a.number) - parseFloat(b.number))

      await this.$db.add({ message: true }, 'phase', null, variables, after.section_id)
    },
    explodeNestable() {
      if (confirm('Are you sure you want to explode this message block? Undo is not yet available...')) {
        const { id, parent, number, section_id } = this.message // eslint-disable-line camelcase
        this.$apollo.mutate({
          mutation: require('~/graphql/ExplodeMessageBlock'),
          variables: {
            id,
            phaseId: section_id,
            blockParent: parent,
            blockParentIsNull: parent === null,
            blockNumberMinusOne: number - 1,
            numberOfMessages: this.children.length,
          },
        })
      }
    },
    restoreNumbers() {
      this.children.forEach((msg, i) => {
        this.$apollo.mutate({
          mutation: require('~/graphql/UpdateMessageNumber'),
          variables: {
            id: msg.id,
            number: i + 1,
          },
        })
      })
    },
    deleteSelected() {
      const sel = this.selected
      if (confirm('Are you sure you want to delete all ' + sel.length + ' selected messages?')) {
        sel.forEach((msg) => {
          const parent = msg.parent
          const variables = { parent, parentIsNull: parent === null }
          this.$db.delete({ message: true }, 'phase', msg, msg.section_id, variables)
        })
        this.clearSelection()
      }
    },
    highlighter(code) {
      code = highlight(code, languages.crystal)
      return code // returns html
    },
    codegen() {

    },
  },
}
</script>

<style lang="css" scoped>
video {
  width: 100%;
}
</style>

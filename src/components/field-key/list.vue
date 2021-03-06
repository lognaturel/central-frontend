<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <div class="heading-with-button">
      <button id="field-key-list-create-button" type="button"
        class="btn btn-primary" @click="showModal('newFieldKey')">
        <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
      </button>
      <i18n tag="p" path="heading[0].full">
        <template #collect>
          <doc-link to="collect-intro/">ODK Collect</doc-link>
        </template>
        <template #formAccess>
          <router-link :to="projectPath('form-access')">{{ $t('heading[0].formAccess') }}</router-link>
        </template>
      </i18n>
      <i18n tag="p" path="heading[1].full">
        <template #clickHere>
          <a href="#" @click.prevent="showModal('submissionOptions')">{{ $t('heading[1].clickHere') }}</a>
        </template>
      </i18n>
    </div>
    <table id="field-key-list-table" class="table">
      <thead>
        <tr>
          <th>{{ $t('header.displayName') }}</th>
          <th>{{ $t('header.created') }}</th>
          <th>{{ $t('header.lastUsed') }}</th>
          <th>{{ $t('header.configureClient') }}</th>
          <th class="actions">{{ $t('header.actions') }}</th>
        </tr>
      </thead>
      <tbody v-if="fieldKeys != null">
        <field-key-row v-for="fieldKey of fieldKeys" :key="fieldKey.id"
          :field-key="fieldKey" :highlighted="highlighted"
          @show-code="showPopover" @revoke="showRevoke"/>
      </tbody>
    </table>
    <loading :state="$store.getters.initiallyLoading(['fieldKeys'])"/>
    <p v-if="fieldKeys != null && fieldKeys.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>

    <popover ref="popover" :target="popover.target" placement="left"
      @hide="hidePopover">
      <field-key-qr-panel :field-key="popover.fieldKey" :managed="managed"/>
    </popover>
    <field-key-new :state="newFieldKey.state" :managed="managed"
      @hide="hideModal('newFieldKey')" @success="afterCreate"/>
    <project-submission-options v-bind="submissionOptions"
      @hide="hideModal('submissionOptions')"/>
    <field-key-revoke v-bind="revoke" @hide="hideRevoke"
      @success="afterRevoke"/>
  </div>
</template>

<script>
import Popover from '../popover.vue';
import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import FieldKeyQrPanel from './qr-panel.vue';
import FieldKeyRow from './row.vue';
import FieldKeyNew from './new.vue';
import FieldKeyRevoke from './revoke.vue';

import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import { loadAsync } from '../../util/async-components';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FieldKeyList',
  components: {
    Popover,
    DocLink,
    Loading,
    FieldKeyQrPanel,
    FieldKeyRow,
    FieldKeyNew,
    FieldKeyRevoke,
    ProjectSubmissionOptions: loadAsync('ProjectSubmissionOptions')
  },
  mixins: [modal({ submissionOptions: 'ProjectSubmissionOptions' }), routes()],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // The id of the highlighted app user
      highlighted: null,
      // `true` to show a managed QR code; `false` to show a legacy QR code.
      managed: true,
      popover: {
        target: null,
        fieldKey: null
      },
      // Modals
      newFieldKey: {
        state: false
      },
      submissionOptions: {
        state: false
      },
      revoke: {
        state: false,
        fieldKey: null
      }
    };
  },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['fieldKeys']),
  created() {
    this.fetchData(false);
  },
  mounted() {
    document.addEventListener('click', this.switchCode);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.switchCode);
  },
  methods: {
    fetchData(resend) {
      this.$emit('fetch-field-keys', resend);
      this.highlighted = null;
    },
    showPopover(fieldKey, link) {
      this.popover.target = link;
      this.popover.fieldKey = fieldKey;
    },
    hidePopover() {
      this.popover.target = null;
      this.popover.fieldKey = null;
    },
    switchCode(event) {
      if (event.target.closest('.field-key-qr-panel .switch-code') == null)
        return;

      event.preventDefault();
      this.managed = !this.managed;

      if (this.popover.target != null) {
        this.$nextTick(() => {
          // Changing this.managed may change the height of the popover: the
          // height of the QR code may change, and there may be a locale for
          // which the height of the text will change.
          this.$refs.popover.update();

          document.querySelector('.popover .field-key-qr-panel .switch-code')
            .focus();
        });
      }
    },
    showRevoke(fieldKey) {
      this.revoke.fieldKey = fieldKey;
      this.showModal('revoke');
    },
    hideRevoke() {
      this.hideModal('revoke');
      this.revoke.fieldKey = null;
    },
    afterCreate(fieldKey) {
      this.fetchData(true);
      this.hideModal('newFieldKey');
      this.$alert().success(this.$t('alert.create', fieldKey));
      this.highlighted = fieldKey.id;
    },
    afterRevoke(fieldKey) {
      this.fetchData(true);
      this.hideRevoke();
      this.$alert().success(this.$t('alert.revoke', fieldKey));
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#field-key-list-table {
  table-layout: fixed;

  th.actions { width: 125px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "create": "Create App User"
    },
    "heading": [
      {
        // {collect} is a link whose text is "ODK Collect".
        "full": "App Users are used to collect data from an application such as {collect}. They typically represent a shared role such as “Vaccinator” but may also represent individuals. App Users in this Project can only download and use Forms within this Project. When you create a new App User, it will not have access to any Forms at first. To set the Forms each App User may access, use the {formAccess} tab.",
        "formAccess": "Form Access"
      },
      {
        "full": "App Users are most appropriate when data collectors need access to multiple Forms, are offline, or you have a complex Form. If you need respondents to self-report or have an online-only form, {clickHere} for other options.",
        "clickHere": "click here"
      }
    ],
    "header": {
      "lastUsed": "Last Used",
      // Header for the table column that shows QR codes to configure data collection clients such as ODK Collect.
      "configureClient": "Configure Client"
    },
    "emptyTable": "There are no App Users yet. You will need to create some to download Forms and submit data from your device.",
    "alert": {
      "create": "The App User “{displayName}” was created successfully.",
      "revoke": "Access was revoked for the App User “{displayName}”."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "create": "Vytvořit uživatele aplikace"
    },
    "heading": [
      {
        "full": "Uživatelé aplikace se používají ke sběru dat z aplikace, jako např. {collect}. Obvykle představují společnou roli, jako je „Vakcinátor“, ale mohou představovat i jednotlivce. Uživatelé aplikace v tomto projektu mohou stahovat a používat pouze formuláře v rámci tohoto projektu. Když vytvoříte nového uživatele aplikace, nebude mít nejprve přístup k žádným formulářům. Chcete-li nastavit formuláře, ke kterým má každý uživatel aplikace přístup, použijte kartu {formAccess}.",
        "formAccess": "Přístup k formuláři"
      },
      {
        "full": "Uživatelé aplikace jsou nejvhodnější, když sběratelé dat potřebují přístup k více formulářům, jsou offline nebo máte složitý formulář. Pokud potřebujete respondenty k vlastnímu hlášení nebo máte pouze formulář online, {clickHere} pro další možnosti.",
        "clickHere": "klikněte zde"
      }
    ],
    "header": {
      "lastUsed": "Naposledy použitý",
      "configureClient": "Konfigurovat klienta"
    },
    "emptyTable": "Zatím nejsou žádní uživatelé aplikace. Pro stažení formulářů a odeslání dat z vašeho zařízení budete muset vytvořit nějaké.",
    "alert": {
      "create": "Uživatel aplikace „{displayName}“ byl úspěšně vytvořen.",
      "revoke": "Přístup k aplikaci byl zrušen uživateli „{displayName}“."
    }
  },
  "de": {
    "action": {
      "create": "App-Benutzer erstellen"
    },
    "heading": [
      {
        "full": "App-Benutzer werden benutzt, um Daten von einer App wie {collect} zu sammeln. Sie repräsentieren typischerweise eine geteilte Rolle wie \"Impfarzt\" aber können auch einzelne Idividuen repräsentieren. App-Benutzer in diesem Projekt können nur Formulare aus diesem Projekt herunterladen und benutzen. Wenn Sie einen neuen App-Benutzer erstellen, wird er oder sie zunächst keinen Zugriff auf Formulare haben. Um Formulare für einen Benutzer zugänglich zu machen, verwenden Sie den Reiter {formAccess}.",
        "formAccess": "Formular-Zugriff"
      },
      {
        "full": "App-Benutzer sind am passendsten, wenn Datensammler Zugriff auf mehrere Formulare benötigen, offline sind oder wenn Sie ein komplexes Formular haben. Wenn Antwortende eine Selbsteinschätzung durchführen müssen oder Sie ein reines Online-Formular haben, {clickHere} für andere Optionen.",
        "clickHere": "klicken Sie hier"
      }
    ],
    "header": {
      "lastUsed": "Zuletzt benutzt",
      "configureClient": "Client konfigurieren"
    },
    "emptyTable": "Ès gibt noch keine Benutzer der App. Sie müssen zumindest einen erstellen, um Formulare herunterladen zu können und um Daten aus Ihrem Gerät hochzuladen.",
    "alert": {
      "create": "Der App-Benutzer \"{displayName}\" ist erstellt worden.",
      "revoke": "Die Zugriffsberechtigng für App-Benuzter \"{displayName}\" wurde entzogen."
    }
  },
  "es": {
    "action": {
      "create": "Crear usuario móvil"
    },
    "heading": [
      {
        "full": "Los usuarios móviles se utilizan para recolectar datos desde una aplicación tal como {collect}. Típicamente representan un rol compartido como “Vacunador” pero también pueden representar a individuos. Los usuarios móviles en este proyecto solo pueden descargar y usar formularios en este proyecto. Cuando usted crea un nuevo usuario móvil, al principio este no tendrá acceso a ningún formulario. Para definir los formularios a los que cada usuario móvil puede acceder, utilice la pestaña {formAccess}.",
        "formAccess": "Acceso a Formulario"
      },
      {
        "full": "Los usuarios móviles son más apropiados cuando los recopiladores de datos necesitan acceso a varios formularios, están fuera de línea o tiene un Formulario complejo. Si necesita que los encuestados se autoinforme o tengan un formulario solo en línea, {clickHere} busque otras opciones.",
        "clickHere": "haga clic aquí"
      }
    ],
    "header": {
      "lastUsed": "Última utilizada",
      "configureClient": "Configurar cliente"
    },
    "emptyTable": "Todavía no hay usuarios móviles. Deberá crear algunos para descargar formularios y enviar datos desde su dispositivo.",
    "alert": {
      "create": "El usuario móvil \"{displayName}\" se creó correctamente.",
      "revoke": "Se revocó el acceso para el usuario móvil \"{displayName}\"."
    }
  },
  "fr": {
    "action": {
      "create": "Créer un utilisateur mobile"
    },
    "heading": [
      {
        "full": "Les utilisateurs mobiles sont utilisés pour faire la collecte de données depuis une application telle que {collect}. Ils représentent typiquement un rôle partagé tel que \"agent de vaccination\" mais peuvent aussi représenter des individus. Les utilisateurs mobiles dans ce projet peuvent seulement télécharger et utiliser les formulaires de ce projet. Quand vous créez un nouvel utilisateur mobile, il n'aura accès à aucun formulaire. Pour définir les formulaires auxquels chaque utilisateur mobile peut accéder, utilisez l'onglet {formAccess}.",
        "formAccess": "\"accès aux formulaires\""
      },
      {
        "full": "Les utilisateurs mobiles conviennent particulièrement bien quand les collecteurs de données doivent accéder à plusieurs formulaires, sont hors-ligne, ou ont des formulaires complexes. Si vous voulez que des répondants remplissent directement votre formulaire ou vos collecteurs de données auront toujours accès à l'Internet, {clickHere} pour d'autres méthodes d'envoi de données.",
        "clickHere": "cliquez ici"
      }
    ],
    "header": {
      "lastUsed": "Dernière utilisation",
      "configureClient": "Configurer le client"
    },
    "emptyTable": "Il n'y a pas encore d’utilisateur mobile. Vous devez en créer pour télécharger des formulaires et soumettre des données depuis votre appareil.",
    "alert": {
      "create": "L'utilisateur mobile “{displayName}” a été correctement créé.",
      "revoke": "L'accès de l'utilisateur mobile “{displayName}” a été retiré ."
    }
  },
  "id": {
    "action": {
      "create": "Buat Pengguna Aplikasi"
    },
    "heading": [
      {
        "full": "Pengguna Aplikasi bertugas untuk mengumpulkan data dari aplikasi seperti {collect}. Mereka biasanya merepresentasikan peran bersama, seperti \"Vaksinator\", atau bisa juga merepresentasikan secara individu. Pengguna Aplikasi di proyek ini hanya dapat mengunduh dan menggunakan formulir yang tergabung dalam proyek ini. Ketika Anda membuat Pengguna Aplikasi baru, Anda tidak akan mendapatkan akses ke formulir apapun pada tahap awal. Untuk mengatur formulir yang dapat diakses oleh setiap Pengguna Aplikasi, gunakan tab {formAccess}.",
        "formAccess": "Akses Formulir"
      },
      {
        "full": "Pengguna Aplikasi sangat membantu ketika pengumpul data membutuhkan akses ke berbagai formulir, sedang offline, atau ketika Anda memiliki formulir yang kompleks. Apabila Anda membutuhkan responden untuk laporan pribadi atau formulir yang hanya dapat diakses secara online, {clickHere} untuk pilihan lain.",
        "clickHere": "klik di sini"
      }
    ],
    "header": {
      "lastUsed": "Terakhir Digunakan",
      "configureClient": "Klien Konfigurasi"
    },
    "emptyTable": "Belum ada Pengguna Aplikasi. Anda harus membuatnya terlebih dahulu untuk mengunduh formulir dan mengajukan data lewat perangkat Anda.",
    "alert": {
      "create": "Pengguna Aplikasi \"{displayName}\" sukses dibuat.",
      "revoke": "Akses untuk Pengguna Aplikasi \"{displayName}\" telah dicabut."
    }
  }
}
</i18n>

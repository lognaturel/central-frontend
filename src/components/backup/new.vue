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
  <modal id="backup-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')" @shown="$refs.passphrase.focus()">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <template v-if="step === 0">
        <div class="modal-warnings">
          <i18n tag="p" path="steps[0].warning.full">
            <template #forum>
              <a href="https://forum.getodk.org/" target="_blank">{{ $t('steps[0].warning.forum') }}</a>
            </template>
          </i18n>
        </div>
        <p class="modal-introduction">
          {{ $t('steps[0].introduction[0]') }}
          <strong>{{ $t('steps[0].introduction[1]') }}</strong>
          {{ $t('steps[0].introduction[2]') }}
        </p>
        <form @submit.prevent="initiate">
          <form-group ref="passphrase" v-model="passphrase"
            :placeholder="$t('field.passphrase')" autocomplete="off"
            strengthmeter/>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary"
              :disabled="awaitingResponse">
              {{ $t('action.next') }} <spinner :state="awaitingResponse"/>
            </button>
            <button type="button" class="btn btn-link"
              :disabled="awaitingResponse" @click="$emit('hide')">
              {{ $t('action.cancel') }}
            </button>
          </div>
        </form>
      </template>
      <template v-else-if="step === 1">
        <div class="modal-introduction">
          <i18n tag="p" path="steps[1].introduction[0].full">
            <template #here>
              <a href="https://accounts.google.com/SignUp" target="_blank">{{ $t('steps[1].introduction[0].here') }}</a>
            </template>
          </i18n>
          <p>{{ $t('steps[1].introduction[1]') }}</p>
          <p>{{ $t('steps[1].introduction[2]') }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary"
            :disabled="awaitingResponse" @click="moveToConfirmation">
            {{ $t('action.next') }} <spinner :state="awaitingResponse"/>
          </button>
          <button type="button" class="btn btn-link"
            :disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.cancel') }}
          </button>
        </div>
      </template>
      <template v-if="step === 2">
        <div class="modal-introduction">
          <i18n tag="p" path="steps[2].introduction[0].full">
            <template #here>
              <a href="#" role="button" @click.prevent="openGoogle">{{ $t('steps[2].introduction[0].here') }}</a>
            </template>
          </i18n>
          <p>{{ $t('steps[2].introduction[1]') }}</p>
        </div>
        <form @submit.prevent="verify">
          <form-group ref="confirmationText" v-model.trim="confirmationText"
            :placeholder="$t('field.confirmationText')" required
            autocomplete="off"/>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary"
              :disabled="awaitingResponse">
              {{ $t('action.next') }} <spinner :state="awaitingResponse"/>
            </button>
            <button type="button" class="btn btn-link"
              :disabled="awaitingResponse" @click="$emit('hide')">
              {{ $t('action.cancel') }}
            </button>
          </div>
        </form>
      </template>
    </template>
  </modal>
</template>

<script>
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { noop } from '../../util/util';

const GOOGLE_BREAKPOINT = 601;

export default {
  name: 'BackupNew',
  components: { FormGroup, Modal, Spinner },
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false,
      // The step in the wizard
      step: 0,
      passphrase: '',
      googleUrl: null,
      authToken: null,
      confirmationText: ''
    };
  },
  watch: {
    state(state) {
      if (!state) {
        this.step = 0;
        this.passphrase = '';
        this.googleUrl = null;
        this.authToken = null;
        this.confirmationText = '';
      }
    }
  },
  methods: {
    initiate() {
      this.post('/config/backups/initiate', { passphrase: this.passphrase })
        .then(({ data }) => {
          this.step += 1;
          this.googleUrl = data.url;
          this.authToken = data.token;
        })
        .catch(noop);
    },
    openGoogle() {
      const size = window.innerWidth >= GOOGLE_BREAKPOINT
        ? `width=${GOOGLE_BREAKPOINT},height=${window.innerHeight},`
        : '';
      window.open(
        this.googleUrl,
        '_blank',
        `${size}location,resizable,scrollbars,status`
      );
    },
    moveToConfirmation() {
      this.openGoogle();
      this.step += 1;
      this.$nextTick(() => {
        this.$refs.confirmationText.focus();
      });
    },
    verify() {
      this.request({
        method: 'POST',
        url: '/config/backups/verify',
        headers: { Authorization: `Bearer ${this.authToken}` },
        data: { code: this.confirmationText },
        problemToAlert: ({ message }) =>
          `${message} ${this.$t('problem.verify')}`
      })
        .then(() => {
          this.$emit('success');
        })
        .catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Set up Backups",
    "steps": [
      {
        "warning": {
          "full": "This backup does not currently include Web Form links. If you share Public Access Links or externally link directly to Web Forms for making new Submissions, we strongly recommend that you also make a full system backup until this is addressed. If you have to restore from backup and end up with broken Preview links, please post to {forum} to get help.",
          "forum": "the forum"
        },
        "introduction": [
          "If you want, you may set up an encryption passphrase which must be used to unlock the backup.",
          "There is no way to recover the passphrase if you lose it!",
          "Be sure to pick something you will remember, or write it down somewhere safe."
        ]
      },
      {
        "introduction": [
          {
            "full": "For safekeeping, the server sends your data to Google Drive. You can sign up for a free account {here}.",
            "here": "here"
          },
          "When you press next, Google will confirm that you wish to allow the server to access your account. The only thing the server will be allowed to touch are the backup files it creates.",
          "Once you confirm this, you will be asked to copy and paste some text back here."
        ]
      },
      {
        "introduction": [
          {
            "full": "Welcome back! Did you get some text to copy and paste? If not, click {here} to try again.",
            "here": "here"
          },
          "Otherwise, paste it below and you are done!"
        ]
      }
    ],
    "field": {
      "passphrase": "Passphrase (optional)",
      "confirmationText": "Confirmation text"
    },
    "problem": {
      "verify": "Please try again, and go to the community forum if the problem continues."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Nastavení záloh",
    "steps": [
      {
        "warning": {
          "full": "Tato záloha aktuálně neobsahuje odkazy na webové formuláře. Pokud sdílíte veřejné přístupové odkazy nebo externě odkazujete přímo na webové formuláře za účelem vytváření nových příspěvků, důrazně doporučujeme provést také úplnou zálohu systému, dokud nebude tento problém vyřešen. Pokud musíte obnovit ze zálohy a skončit s nefunkčními odkazy na náhled, pošlete příspěvek na {forum} a požádejte o pomoc.",
          "forum": "fórum"
        },
        "introduction": [
          "Pokud chcete, můžete nastavit šifrovací přístupové heslo, které musí být použito k odemknutí zálohy.",
          "Pokud heslo ztratíte, není možné jej obnovit.",
          "Nezapomeňte si vybrat něco, na co si vzpomenete, nebo si je zapište na bezpečné místo."
        ]
      },
      {
        "introduction": [
          {
            "full": "Pro účely úschovy server odešle vaše data na Google Drive. Můžete si zaregistrovat bezplatný účet {here}.",
            "here": "zde"
          },
          "Po dalším stisknutí Google potvrdí, že chcete serveru povolit přístup k vašemu účtu. Jediné, čeho se bude server moci dotknout, jsou záložní soubory, které vytvoří.",
          "Jakmile to potvrdíte, budete požádáni o zkopírování a vložení textu sem."
        ]
      },
      {
        "introduction": [
          {
            "full": "Vítej zpět! Dostali jste nějaký text ke kopírování a vložení? Pokud ne, zkuste to znovu kliknutím {here}.",
            "here": "zde"
          },
          "Jinak jej vložte níže a máte hotovo!"
        ]
      }
    ],
    "field": {
      "passphrase": "Heslo (volitelné)",
      "confirmationText": "Potvrzovací text"
    },
    "problem": {
      "verify": "Zkuste to prosím znovu a přejděte na komunitní fórum, pokud problém přetrvává."
    }
  },
  "de": {
    "title": "Sicherheitskopien einrichten",
    "steps": [
      {
        "warning": {
          "full": "Dieses Backup enthält aktuell keine Web-Formular-Links. Wenn Sie öffentliche Zugangslinks teilen oder extern auf Web-Formular-Links verlinken, um neue Übermittlungen zu machen, empfehlen wir, dass Sie auch ein vollständiges System-Backup durchführen, bis dies gelöst ist. Wenn Sie aus einem Backup wiederherstellen müssen und defekte Vorschau-Links erhalten, erstellen Sie einen Eintrag im {forum}, um Hilfe zu erhalten.",
          "forum": "das Forum"
        },
        "introduction": [
          "Sie können das Backup optional mit einer Passphrase sichern. Das Backup kann dann nur mit dieser Passphrase entschlüsselt werden.",
          "Eine verlorene Passphrase kann nicht wiederhergestellt werden!",
          "Wählen Sie etwas gut Merkbares, oder bewahren Sie es an einem sicheren Ort schriftlich auf."
        ]
      },
      {
        "introduction": [
          {
            "full": "Wir sichern Ihre Daten in Google Drive. Sie können {here} ein kostenloses Benutzerkonto erstellen.",
            "here": "hier"
          },
          "Wenn Sie \"weiter\" wählen, wird Google sich bestätigen lassen, dass der Server auf ihr System zugreifen darf. Der Server darf ausschließlich auf die erzeugten Backup-Dateien zugreifen.",
          "Wenn Sie das bestätigen, werden Sie gebeten, etwas Text mit Copy-and-Paste hier einzufügen."
        ]
      },
      {
        "introduction": [
          {
            "full": "Willkommen zurück! Haben Sie einen Text zum Einfügen bekommen? Wenn nicht, klicken Sie bitte {here}.",
            "here": "hier"
          },
          "Oder einfach unten einfügen und fertig."
        ]
      }
    ],
    "field": {
      "passphrase": "Passphrase (optional)",
      "confirmationText": "Bestätigungstext"
    },
    "problem": {
      "verify": "Bitte versuchen Sie es nochmal, und besuchen Sie das Community Forum, wenn es weiterhin nicht funktioniert."
    }
  },
  "es": {
    "title": "Configurar copias de seguridad.",
    "steps": [
      {
        "introduction": [
          "Si usted quiere, puede configurar una frase de contraseña de cifrado que debe usarse para desbloquear la copia de seguridad.",
          "¡No hay forma de recuperar la frase de contraseña si la pierde!",
          "Asegúrese de elegir algo que recordará o anótelo en un lugar seguro."
        ]
      },
      {
        "introduction": [
          {
            "full": "Para su custodia, el servidor envía sus datos a Google Drive. Puedes registrarte para obtener una cuenta gratuita {here}.",
            "here": "Aquí"
          },
          "Cuando presione siguiente, Google confirmará que desea permitir que el servidor acceda a su cuenta. Lo único que el servidor podrá tocar son los archivos de respaldo que crea.",
          "Una vez que confirme esto, se le pedirá que copie y pegue algún texto aquí."
        ]
      },
      {
        "introduction": [
          {
            "full": "¡Bienvenido de vuelta! ¿Recibió algún texto para copiar y pegar? Si no, hacer clic {here} para volver a intentarlo.",
            "here": "Aquí"
          },
          "De lo contrario, péguelo a continuación y listo!"
        ]
      }
    ],
    "field": {
      "passphrase": "Frase de contraseña (opcional)",
      "confirmationText": "Texto de confirmación"
    },
    "problem": {
      "verify": "Vuelva a intentarlo, y vaya al foro de la comunidad si el problema continúa."
    }
  },
  "fr": {
    "title": "Configurer des sauvegardes",
    "steps": [
      {
        "warning": {
          "full": "Cette sauvegarde n'inclue pas les liens de formulaires Web. Si vous partagez des liens d'accès public ou partagez des liens directs à vos formulaires Web, nous recommandons fortement que vous fassiez également une sauvegarde complete du système jusqu'à ce que ceci soit adressé. Si vous devez restaurer vos données d'une sauvegarde et vous retrouvez avec des liens d'aperçu qui ne fonctionnent pas, veuillez écrire un message sur {forum} pour recevoir de l'aide.",
          "forum": "le forum"
        },
        "introduction": [
          "Si vous le désirez, vous pouvez définir une phrase de passe de cryptage pour déverrouiller la sauvegarde.",
          "Il n'y a aucun moyen de retrouver la phrase de passe si vous la perdez !",
          "Soyez sûr de choisir quelque-chose dont vous vous souviendrez, ou écrivez le dans un endroit sûr."
        ]
      },
      {
        "introduction": [
          {
            "full": "Pour la sauvegarde, le serveur envoie vos données à Google Drive. Vous pouvez créer un compte gratuit {here}.",
            "here": "ici"
          },
          "Lorsque vous appuyez sur le bouton suivant, Google confirmera que vous souhaitez autoriser le serveur à accéder à votre compte. La seule chose que le serveur sera autorisé à toucher sont les fichiers de sauvegarde qu'il crée.",
          "Une fois que vous aurez confirmé cela, il vous sera demandé de copier et de coller du texte ici."
        ]
      },
      {
        "introduction": [
          {
            "full": "Bienvenue à nouveau ! Vous avez reçu du texte à copier-coller ? Si ce n'est pas le cas, cliquez {here} pour réessayer.",
            "here": "ici"
          },
          "Sinon, collez ci-bas et c'est fini !"
        ]
      }
    ],
    "field": {
      "passphrase": "Phrase de passe (optionnel)",
      "confirmationText": "Texte de confirmation"
    },
    "problem": {
      "verify": "Merci d'essayer à nouveau, et de consulter le forum de la communauté si le problème persiste."
    }
  },
  "id": {
    "title": "Mengatur Data Cadangan",
    "steps": [
      {
        "introduction": [
          "Bila ingin, Anda dapat mengatur enkripsi frasa sandi yang harus digunakan untuk membuka data cadangan.",
          "Frasa sandi yang hilang/lupa tidak dapat dikembalikan/diatur ulang!",
          "Pastikan Anda memilih sesuatu yang mudah Anda ingat, atau catat frasa sandi Anda di tempat aman."
        ]
      },
      {
        "introduction": [
          {
            "full": "Demi keamanan, server mengirimkan data Anda ke Google Drive. Anda dapat membuat akun gratis {here}.",
            "here": "di sini"
          },
          "Ketika mekenan tombol lanjut, Google akan mengonfirmasi bahwa Anda mengizinkan server mengakses akun Anda. Server hanya akan memiliki akses terhadap data cadangan yang dibuat.",
          "Setelah mengonfirmasi, Anda akan diminta untuk menyalin dan menempel teks di sini."
        ]
      },
      {
        "introduction": [
          {
            "full": "Selamat datang kembali! Apakah Anda sudah menerima teks untuk disalin dan ditempel? Jika belum, klik {here} untuk mencoba lagi.",
            "here": "di sini"
          },
          "Cara lainnya, tempel teks di bawah ini dan Anda telah selesai!"
        ]
      }
    ],
    "field": {
      "passphrase": "Frasa sandi (opsional)",
      "confirmationText": "Teks konfirmasi"
    },
    "problem": {
      "verify": "Mohon coba lagi, dan kunjungi forum komunitas jika terjadi masalah berkelanjutan."
    }
  }
}
</i18n>

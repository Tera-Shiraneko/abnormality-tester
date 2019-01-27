const SettingsUI = require('tera-mod-ui').Settings;

module.exports = function Abnormalitytester(mod) {

    if (mod.proxyAuthor !== 'caali' || !global.TeraProxy) {
        mod.warn('You are trying to use this module on an unsupported legacy version of tera-proxy.');
        mod.warn('The module may not work as expected, and even if it works for now, it may break at any point in the future!');
        mod.warn('It is highly recommended that you download the latest official version from the #proxy channel in http://tiny.cc/caalis-tera-proxy');
    }

    let ids;

    mod.command.add('abnormalitytester', () => {
        if (ui) {
            ui.show();
        } else {
            mod.settings.enabled = !mod.settings.enabled;
            mod.command.message(`Abnormality tester is now ${mod.settings.enabled ? "enabled" : "disabled"}.`);
        }
    });

    mod.command.add('abstart', (id) => {
        ids = Number.parseInt((id.replace(/\D+/g, '')), 10);
        abbegin(ids);
        mod.command.message('Attempted to start abnormality ' + ids + '.');
        if (Number.isNaN(ids) || ids === 0) {
            mod.command.message('Please enter an valid abnormality id.');
        }
        if (!mod.settings.enabled) {
            mod.settings.enabled = true;
            mod.command.message('Module got activated for you please retype the command again.');
        }
        if (mod.settings.duration === 0 || mod.settings.duration < 10000 || mod.settings.stack === 0) {
            mod.settings.duration = 610000;
            mod.settings.stack = 1;
            mod.command.message('You manually edited the config file with invalid settings default settings will be applied.');
        }
    });

    mod.command.add('abend', (id) => {
        ids = Number.parseInt((id.replace(/\D+/g, '')), 10);
        abend(ids);
        mod.command.message('Attempted to end abnormality ' + ids + '.');
        if (Number.isNaN(ids) || ids === 0) {
            mod.command.message('Please enter an valid abnormality id.');
        }
        if (!mod.settings.enabled) {
            mod.settings.enabled = true;
            mod.command.message('Module got activated for you please retype the command again.');
        }
    });

    mod.command.add('abduration', (id) => {
        mod.settings.duration = Number.parseInt((id.replace(/\D+/g, '')), 10);
        mod.command.message('Abnormality duration set to ' + mod.settings.duration + '.');
        if (Number.isNaN(mod.settings.duration) || mod.settings.duration === 0 || mod.settings.duration < 10000) {
            mod.settings.duration = 610000;
            mod.command.message('Default settings applied please enter an valid duration number.');
        }
    });

    mod.command.add('abstack', (id) => {
        mod.settings.stack = Number.parseInt((id.replace(/\D+/g, '')), 10);
        mod.command.message('Abnormality stacks set to ' + mod.settings.stack + '.');
        if (Number.isNaN(mod.settings.stack) || mod.settings.stack === 0) {
            mod.settings.stack = 1;
            mod.command.message('Default settings applied please enter an valid stack number.');
        }
    });

    function abbegin(iden) {
        if (!mod.settings.enabled || iden === 0 || mod.settings.duration === 0 || mod.settings.duration < 10000 || mod.settings.stack === 0) return;
        mod.send('S_ABNORMALITY_BEGIN', 3, {
            target: mod.game.me.gameId,
            source: mod.game.me.gameId,
            id: iden,
            duration: mod.settings.duration,
            unk: 0,
            stacks: mod.settings.stack,
            unk2: 0,
            unk3: 0
        });
    }

    function abend(iden) {
        if (!mod.settings.enabled || iden === 0 || mod.settings.duration === 0 || mod.settings.duration < 10000 || mod.settings.stack === 0) return;
        mod.send('S_ABNORMALITY_END', 1, {
            target: mod.game.me.gameId,
            id: iden
        });
    }

    let ui = null;
    if (global.TeraProxy.GUIMode) {
        ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, { height: 190 }, { alwaysOnTop: true });
        ui.on('update', settings => { mod.settings = settings; });

        this.destructor = () => {
            if (ui) {
                ui.close();
                ui = null;
            }
        };
    }
};

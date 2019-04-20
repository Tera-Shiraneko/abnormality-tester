const SettingsUI = require('tera-mod-ui').Settings;

module.exports = function Abnormality_Tester(mod) {

    if (mod.proxyAuthor !== 'caali' || !global.TeraProxy) {
        mod.warn('You are trying to use this module on an unsupported legacy version of tera-proxy.');
        mod.warn('The module may not work as expected, and even if it works for now, it may break at any point in the future!');
        mod.warn('It is highly recommended that you download the latest official version from the #proxy channel in http://tiny.cc/caalis-tera-proxy');
    }

    let abnormality_timers = {},
        abnormalities = {},
        value;

    mod.command.add('abnormal', (arg_1, arg_2) => {
        if (arg_1 === 'begin') {
            value = Number.parseInt(arg_2);
            mod.command.message(`Attempted to start abnormality ${value} with ${mod.settings.duration/1000} seconds duration and ${mod.settings.stack} stacks.`);
            abbegin(value);
        }
        else if (arg_1 === 'end') {
            value = Number.parseInt(arg_2);
            mod.command.message(`Attempted to end abnormality ${value}.`);
            abend(value);
        }
        else if (arg_1 === 'duration') {
            value = Number.parseInt(arg_2);
            mod.settings.duration = value;
            mod.command.message(`Abnormality duration set to ${mod.settings.duration/1000} seconds.`);
        }
        else if (arg_1 === 'stacks') {
            value = Number.parseInt(arg_2);
            mod.settings.stack = value;
            mod.command.message(`Abnormality stacks set to ${mod.settings.stack} stacks.`);
        }
        else if (arg_1 === 'config') {
            if (ui) {
                ui.show();
            }
        }
    });

    mod.hook('S_ABNORMALITY_BEGIN', 3, (event) => {
        if (mod.game.me.is(event.target))
            abnormalities[event.id] = Date.now() + event.duration;
    });

    mod.hook('S_ABNORMALITY_REFRESH', 1, (event) => {
        if (mod.game.me.is(event.target))
            abnormalities[event.id] = Date.now() + event.duration;
    });

    mod.hook('S_ABNORMALITY_END', 1, (event) => {
        if (mod.game.me.is(event.target))
            delete abnormalities[event.id];
    });

    function abnormalityduration(id) {
        if (!abnormalities[id])
            return 0;
        return abnormalities[id] - Date.now();
    }

    function abbegin(abstartid) {
        if (abstartid === 0 || Number.isNaN(abstartid)) {
            mod.command.message('Please enter an valid abnormality id.');
            return;
        }
        if (mod.settings.duration === 0 || Number.isNaN(mod.settings.duration)) {
            mod.settings.duration = 610000;
            mod.command.message('Default duration applied please enter an valid duration number next time.');
        }
        if (mod.settings.stack === 0 || Number.isNaN(mod.settings.stacks)) {
            mod.settings.stacks = 1;
            mod.command.message('Default stacks applied please enter an valid stack number next time.');
        }
        mod.send('S_ABNORMALITY_BEGIN', 3, {
            target: mod.game.me.gameId,
            source: mod.game.me.gameId,
            id: abstartid,
            duration: mod.settings.duration,
            stacks: mod.settings.stack
        });

        let timer = setTimeout(() => {
            mod.send('S_ABNORMALITY_END', 1, {
                target: mod.game.me.gameId,
                id: abstartid
            });
        }, mod.settings.duration);
        abnormality_timers[abstartid] = timer;
    }

    function abend(abendid) {
        if (abendid === 0 || Number.isNaN(abendid)) {
            mod.command.message('Please enter an valid abnormality id.');
            return;
        }
        if (abnormality_timers[abendid] !== undefined) {
            clearTimeout(abnormality_timers[abendid]);
            delete abnormality_timers[abendid];
        } else {
            if (!abnormalityduration(abendid) > 0) {
                mod.command.message('You have to trigger the abnormality before ending it.');
                return;
            }
        }
        mod.send('S_ABNORMALITY_END', 1, {
            target: mod.game.me.gameId,
            id: abendid
        });
    }

    mod.game.on('leave_game', () => {
        for (let i in abnormality_timers) {
            clearTimeout(abnormality_timers[i]);
        }
        abnormality_timers = {};
    });

    let ui = null;
    if (global.TeraProxy.GUIMode) {
        ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, { height: 155 }, { alwaysOnTop: true });
        ui.on('update', settings => { mod.settings = settings; });

        this.destructor = () => {
            if (ui) {
                ui.close();
                ui = null;
            }
        };
    }
};
const SettingsUI = require('tera-mod-ui').Settings;

module.exports = function Abnormalitytester(mod) {

    if (mod.proxyAuthor !== 'caali' || !global.TeraProxy) {
        mod.warn('You are trying to use this module on an unsupported legacy version of tera-proxy.');
        mod.warn('The module may not work as expected, and even if it works for now, it may break at any point in the future!');
        mod.warn('It is highly recommended that you download the latest official version from the #proxy channel in http://tiny.cc/caalis-tera-proxy');
    }

    let abnormalitytimers = {};
    let abnormalities = {};

    mod.command.add('abconfig', () => {
        if (ui) {
            ui.show();
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

    mod.command.add('abstart', (id, dur, st) => {
        let ids = Number.parseInt((id.replace(/\D+/g, '')), 10);
        let duration = dur != null ? Number.parseInt((dur.replace(/\D+/g, '')), 10) : mod.settings.duration;
        let stacks = st != null ? Number.parseInt((st.replace(/\D+/g, '')), 10) : mod.settings.stack;
        mod.command.message(`Attempted to start abnormality ${ids} with: ${duration/1000}s duration and ${stacks} stacks.`);
        abbegin(ids, duration, stacks);
    });

    mod.command.add('abend', (id) => {
        let ids = Number.parseInt((id.replace(/\D+/g, '')), 10);
        mod.command.message(`Attempted to end abnormality ${ids}.`);
        abend(ids);
    });

    mod.command.add('abduration', (id) => {
        mod.settings.duration = Number.parseInt((id.replace(/\D+/g, '')), 10);
        if (mod.settings.duration === 0 || mod.settings.duration < 10000) {
            mod.command.message('Invalid setting please enter an valid duration number.');
            return;
        }
        mod.command.message(`Abnormality duration set to ${mod.settings.duration/1000}s.`);
    });

    mod.command.add('abstack', (id) => {
        mod.settings.stack = Number.parseInt((id.replace(/\D+/g, '')), 10);
        if (mod.settings.stack === 0) {
            mod.command.message('Invalid setting please enter an valid stack number.');
            return;
        }
        mod.command.message(`Abnormality stacks set to ${mod.settings.stack} stacks.`);
    });

    function abbegin(abstartid, duration, stack) {
        if (abstartid === 0) {
            mod.command.message('Please enter an valid abnormality id.');
            return;
        }
        if (duration === 0) {
            duration = mod.settings.duration;
            mod.command.message('Default duration applied please enter an valid duration number next time.');
        }
        if (stack === 0) {
            stack = mod.settings.stack;
            mod.command.message('Default stacks applied please enter an valid stack number next time.');
        }
        mod.send('S_ABNORMALITY_BEGIN', 3, {
            target: mod.game.me.gameId,
            source: mod.game.me.gameId,
            id: abstartid,
            duration: duration,
            unk: 0,
            stacks: stack,
            unk2: 0,
            unk3: 0
        });
        let timer = setTimeout(() => {
            mod.send('S_ABNORMALITY_END', 1, {
                target: mod.game.me.gameId,
                id: abstartid
            });
        }, duration);
        abnormalitytimers[abstartid] = timer;
    }

    function abend(abendid) {
        if (abendid === 0) {
            mod.command.message('Please enter an valid abnormality id.');
            return;
        }
        if (abnormalitytimers[abendid] !== undefined) {
            clearTimeout(abnormalitytimers[abendid]);
            delete abnormalitytimers[abendid];
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
        for (let i in abnormalitytimers) {
            clearTimeout(abnormalitytimers[i]);
        }
        abnormalitytimers = {};
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
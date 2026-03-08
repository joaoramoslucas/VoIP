import { useEffect } from 'react';
import RNCallKeep, { IOptions } from 'react-native-callkeep';
import { useSipStore } from '../../state/sip/sipStore';

/**
 * Registra os hooks do CallKit (iOS) e ConnectionService (Android).
 * Como o Android nativo já atende ao CallForegroundService, isso brilha mais no iOS.
 */
export const useCallKeepInit = () => {
    const { actions } = useSipStore();

    useEffect(() => {
        const options: IOptions = {
            ios: {
                appName: 'SipApp',
                imageName: 'sim_icon',
                supportsVideo: false,
                maximumCallGroups: '1',
                maximumCallsPerCallGroup: '1',
            },
            android: {
                alertTitle: 'Permissão necessária',
                alertDescription: 'Este app precisa acessar seu microfone.',
                cancelButton: 'Cancelar',
                okButton: 'ok',
                selfManaged: true,
                additionalPermissions: [],
            }
        };

        try {
            RNCallKeep.setup(options).then(accepted => {
                console.log('[CallKeep] Setup aceito:', accepted);
            });

            // 1. Quando o usuário clica no Botão Verde do iPhone
            RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
                console.log('[CallKeep] answerCall:', callUUID);
                // Avisamos nosso SipNativeModule nativo para atender
                actions.acceptCall();
                RNCallKeep.setCurrentCallActive(callUUID);
            });

            // 2. Quando o usuário clica no Botão Vermelho do iPhone
            RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
                console.log('[CallKeep] endCall:', callUUID);
                // Avisamos nosso SipNativeModule nativo para recusar/desligar
                actions.declineCall();
            });

            // 3. Quando o usuário clica no botão "Mute" na tela nativa do iPhone
            RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted, callUUID }) => {
                console.log('[CallKeep] Mute alterado:', muted);
                actions.setMuted(muted);
            });

        } catch (e) {
            console.error('[CallKeep] Erro de setup:', e);
        }

        return () => {
            RNCallKeep.removeEventListener('answerCall');
            RNCallKeep.removeEventListener('endCall');
            RNCallKeep.removeEventListener('didPerformSetMutedCallAction');
        };
    }, []);
};

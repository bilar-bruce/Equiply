import { useEffect, useRef } from 'react';
import { createEchoClient } from '../realtime/echo';

/**
 * Subscribes Equiply views to Laravel Reverb real-time channels:
 *  - Public `catalog` channel (live equipment availability & inventory sync)
 *  - Private `custodian.ops` channel (live reservation/intake/maintenance desk alerts)
 *  - Private `users.{id}` channel (personal rental & peer-lender status notifications)
 */
export function useEquiplyRealtime({
    user,
    token,
    isAuthenticated,
    isCustodian,
    isAdmin,
    onCatalogUpdate,
    onCustodianUpdate,
    onUserUpdate,
}) {
    const callbacksRef = useRef({
        onCatalogUpdate,
        onCustodianUpdate,
        onUserUpdate,
    });

    useEffect(() => {
        callbacksRef.current = {
            onCatalogUpdate,
            onCustodianUpdate,
            onUserUpdate,
        };
    }, [onCatalogUpdate, onCustodianUpdate, onUserUpdate]);

    useEffect(() => {
        const echo = createEchoClient(isAuthenticated ? token : null);
        if (!echo) {
            return undefined;
        }

        // 1. Public catalog channel (active for guests and authenticated users)
        echo.channel('catalog').listen('.catalog.updated', (payload) => {
            callbacksRef.current.onCatalogUpdate?.(payload);
        });

        // 2. Private custodian operations channel
        const shouldJoinCustodian = Boolean(isAuthenticated && (isCustodian || isAdmin));
        if (shouldJoinCustodian) {
            echo.private('custodian.ops').listen('.custodian.updated', (payload) => {
                callbacksRef.current.onCustodianUpdate?.(payload);
            });
        }

        // 3. Private per-user channel (students & peer lenders)
        const userId = isAuthenticated && user?.id ? String(user.id) : null;
        if (userId) {
            echo.private(`users.${userId}`).listen('.user.updated', (payload) => {
                callbacksRef.current.onUserUpdate?.(payload);
            });
        }

        return () => {
            try {
                echo.leave('catalog');
                if (shouldJoinCustodian) {
                    echo.leave('custodian.ops');
                }
                if (userId) {
                    echo.leave(`users.${userId}`);
                }
                echo.disconnect();
            } catch {
                // Ignore cleanup errors during rapid navigation or hot reload
            }
        };
    }, [isAuthenticated, token, isCustodian, isAdmin, user?.id]);
}

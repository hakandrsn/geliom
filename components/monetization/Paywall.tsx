import React, { useCallback, useMemo } from 'react';
import { AdaptyPaywallView } from 'react-native-adapty';
import type { EventHandlers } from 'react-native-adapty';
import {StyleSheet} from "react-native";

function Paywall({ paywall }:any) {
    const paywallParams = useMemo(() => ({
        loadTimeoutMs: 3000,
    }), []);

    const onCloseButtonPress = useCallback<EventHandlers['onCloseButtonPress']>(() => {}, []);
    const onAndroidSystemBack = useCallback<EventHandlers['onAndroidSystemBack']>(() => {}, []);
    const onProductSelected = useCallback<EventHandlers['onProductSelected']>((productId) => {}, []);
    const onPurchaseStarted = useCallback<EventHandlers['onPurchaseStarted']>((product) => {}, []);
    const onPurchaseCompleted = useCallback<EventHandlers['onPurchaseCompleted']>((purchaseResult, product) => {}, []);
    const onPurchaseFailed = useCallback<EventHandlers['onPurchaseFailed']>((error, product) => {}, []);
    const onRestoreStarted = useCallback<EventHandlers['onRestoreStarted']>(() => {}, []);
    const onRestoreCompleted = useCallback<EventHandlers['onRestoreCompleted']>((profile) => {}, []);
    const onRestoreFailed = useCallback<EventHandlers['onRestoreFailed']>((error) => {}, []);
    const onPaywallShown = useCallback<EventHandlers['onPaywallShown']>(() => {}, []);
    const onPaywallClosed = useCallback<EventHandlers['onPaywallClosed']>(() => {}, []);
    const onRenderingFailed = useCallback<EventHandlers['onRenderingFailed']>((error) => {}, []);
    const onLoadingProductsFailed = useCallback<EventHandlers['onLoadingProductsFailed']>((error) => {}, []);
    const onUrlPress = useCallback<EventHandlers['onUrlPress']>((url) => {}, []);
    const onCustomAction = useCallback<EventHandlers['onCustomAction']>((actionId) => {}, []);
    const onWebPaymentNavigationFinished = useCallback<EventHandlers['onWebPaymentNavigationFinished']>(() => {}, []);

    return (
        <AdaptyPaywallView
            paywall={paywall}
            params={paywallParams}
            style={styles.paywall}
            onCloseButtonPress={onCloseButtonPress}
            onAndroidSystemBack={onAndroidSystemBack}
            onProductSelected={onProductSelected}
            onPurchaseStarted={onPurchaseStarted}
            onPurchaseCompleted={onPurchaseCompleted}
            onPurchaseFailed={onPurchaseFailed}
            onRestoreStarted={onRestoreStarted}
            onRestoreCompleted={onRestoreCompleted}
            onRestoreFailed={onRestoreFailed}
            onPaywallShown={onPaywallShown}
            onPaywallClosed={onPaywallClosed}
            onRenderingFailed={onRenderingFailed}
            onLoadingProductsFailed={onLoadingProductsFailed}
            onCustomAction={onCustomAction}
            onUrlPress={onUrlPress}
            onWebPaymentNavigationFinished={onWebPaymentNavigationFinished}
        />
    );
}

const styles = StyleSheet.create({
    paywall: {
        width: '100%',
        height: '100%',
    }
})
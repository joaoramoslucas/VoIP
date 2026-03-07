import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import { DialerScreen } from '../../screens/Dialer/SipDialerScreen';
import { ContactsScreen } from '../../screens/Contacts/ContactsScreen';
import { HistoryScreen } from '../../screens/History/HistoryScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
        <Text style={tabStyles.icon}>{emoji}</Text>
    </View>
);

export const MainTabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: tabStyles.bar,
                tabBarActiveTintColor: '#4F8CFF',
                tabBarInactiveTintColor: '#4A5568',
                tabBarLabelStyle: tabStyles.label,
                tabBarItemStyle: tabStyles.item,
            }}
        >
            <Tab.Screen
                name="Dialer"
                component={DialerScreen}
                options={{
                    tabBarLabel: 'Teclado',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📞" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="Contacts"
                component={ContactsScreen}
                options={{
                    tabBarLabel: 'Contatos',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    tabBarLabel: 'Histórico',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🕐" focused={focused} />,
                }}
            />
        </Tab.Navigator>
    );
};

const tabStyles = StyleSheet.create({
    bar: {
        backgroundColor: '#0D1117',
        borderTopWidth: 1,
        borderTopColor: '#1E2D47',
        height: 72,
        paddingBottom: 10,
        paddingTop: 8,

        marginBottom: 50,
    },
    item: { paddingVertical: 2 },
    label: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    iconWrap: {
        width: 36,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: {
        backgroundColor: '#4F8CFF18',
    },
    icon: { fontSize: 20 },
});

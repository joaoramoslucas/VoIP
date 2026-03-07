import 'react-native-gesture-handler';
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MainTabNavigator } from './MainTabNavigator';
import { DrawerContent } from './DrawerContent';

const Drawer = createDrawerNavigator();

export const DrawerNavigator: React.FC = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <DrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    width: 300,
                    backgroundColor: '#0D1117',
                },
                drawerType: 'slide',
                overlayColor: 'rgba(0,0,0,0.6)',
                swipeEdgeWidth: 60,
            }}
        >
            <Drawer.Screen name="Home" component={MainTabNavigator} />
        </Drawer.Navigator>
    );
};

// Minimal stub for react-native-safe-area-context in the node test env.
const React = require('react')
const { View } = require('react-native')

const insets = { top: 0, right: 0, bottom: 0, left: 0 }

const SafeAreaView = ({ children, style, testID, edges, ...rest }) =>
  React.createElement(View, { style, testID, ...rest }, children)

const SafeAreaProvider = ({ children }) => children

const useSafeAreaInsets = () => insets

const SafeAreaInsetsContext = React.createContext(insets)

module.exports = {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
  SafeAreaInsetsContext,
}

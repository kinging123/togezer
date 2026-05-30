// Minimal RN stub for Jest (testEnvironment: 'node'). Add primitives here when new components are tested.
const React = require('react')

const Platform = {
  OS: 'ios',
  select: (obj) => ('ios' in obj ? obj.ios : obj.default),
  Version: '18.0',
  isTesting: true,
  isTV: false,
}

const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => style,
  hairlineWidth: 1,
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
}

const View = ({ children, style, testID, ...rest }) =>
  React.createElement('View', { style, testID, ...rest }, children)

const Text = ({ children, style, testID, ...rest }) =>
  React.createElement('Text', { style, testID, ...rest }, children)

const TextInput = ({ value, onChangeText, placeholder, placeholderTextColor, testID, style, ...rest }) =>
  React.createElement('TextInput', {
    value,
    onChangeText,
    placeholder,
    testID,
    style,
    ...rest,
  })

const Pressable = ({ children, onPress, disabled, style, testID, ...rest }) =>
  React.createElement(
    'Pressable',
    {
      onPress: disabled ? undefined : onPress,
      disabled,
      testID,
      style: typeof style === 'function' ? style({ pressed: false }) : style,
      ...rest,
    },
    children,
  )

const SafeAreaView = ({ children, style, testID, ...rest }) =>
  React.createElement('View', { style, testID, ...rest }, children)

const KeyboardAvoidingView = ({ children, style, testID, ...rest }) =>
  React.createElement('View', { style, testID, ...rest }, children)

const ScrollView = ({ children, style, contentContainerStyle, testID, refreshControl, ...rest }) =>
  React.createElement('ScrollView', { style, testID, ...rest }, children)

const ActivityIndicator = ({ testID, ...rest }) =>
  React.createElement('ActivityIndicator', { testID, ...rest })

const RefreshControl = ({ refreshing, onRefresh, ...rest }) =>
  React.createElement('RefreshControl', { refreshing, onRefresh, ...rest })

module.exports = {
  Platform,
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
}

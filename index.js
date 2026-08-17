import { registerRootComponent } from 'expo';
import React from "react";
import { ScrollView, Text, View } from "react-native";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

class TuraXErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("TURAX_RUNTIME_ERROR", error, info);
  }

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#020B16",
          paddingTop: 50,
          paddingHorizontal: 20,
        }}
      >
        <ScrollView>
          <Text
            style={{
              color: "#F5B942",
              fontSize: 26,
              fontWeight: "900",
              marginBottom: 18,
            }}
          >
            TuraX — eroare detectată
          </Text>

          <Text
            selectable
            style={{
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            {String(error?.name || "Error")}
          </Text>

          <Text
            selectable
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              lineHeight: 23,
              marginBottom: 20,
            }}
          >
            {String(error?.message || error)}
          </Text>

          <Text
            selectable
            style={{
              color: "#98A2B3",
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            {String(error?.stack || "")}
          </Text>
        </ScrollView>
      </View>
    );
  }
}

function TuraXAppLoader() {
  const App = require("./App").default;
  return <App />;
}

function TuraXRoot() {
  return (
    <TuraXErrorBoundary>
      <TuraXAppLoader />
    </TuraXErrorBoundary>
  );
}

registerRootComponent(TuraXRoot);

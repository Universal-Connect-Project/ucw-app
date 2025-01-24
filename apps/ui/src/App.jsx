import React, { useState, useEffect } from "react";
import { ApiProvider, ConnectWidget } from "@mxenabled/connect-widget";
import api from "./connect/api";
import "./App.css";

function App() {
  console.log({ api });
  // console.log(api.loadPopularInstitutions());

  const [instrumentationFinished, setInstrumentationFinished] = useState(false);

  useEffect(
    () =>
      api
        .instrumentation(window.app.clientConfig)
        .then(() => setInstrumentationFinished(true)),
    [],
  );

  if (!instrumentationFinished) {
    return null;
  }

  return (
    <ApiProvider apiValue={api}>
      <ConnectWidget
        clientConfig={window.app.clientConfig}
        language={{ locale: "en" }}
        onAnalyticEvent={() => {}}
        onAnalyticPageview={() => {}}
        onPostMessage={() => {}}
        profiles={{}}
      />
    </ApiProvider>
  );
}

export default App;

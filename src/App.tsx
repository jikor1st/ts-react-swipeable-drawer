import React, { PropsWithChildren } from "react";
import ResetStyle from "./styles/resetStyle";
import styled from "styled-components";

function Layout({ children }: PropsWithChildren) {
  return <LayoutContainer>{children}</LayoutContainer>;
}

const LayoutContainer = styled.div`
  width: 100%;
  height: 100%;
  max-width: 450px;
  margin: 0 auto;
  background-color: #ffffff;
`;

function App() {
  return (
    <AppContainer>
      <Layout>
        <ResetStyle />
      </Layout>
    </AppContainer>
  );
}

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  background-color: #cccccc;
`;

export default App;

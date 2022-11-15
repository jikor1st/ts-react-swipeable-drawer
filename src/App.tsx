import React, { PropsWithChildren, Suspense, lazy } from "react";
import ResetStyle from "./styles/resetStyle";
import styled from "styled-components";
import { Routes, Route } from "react-router-dom";

const MainPage = lazy(() => import("./pages/Main"));

const Layout = styled.div`
  width: 100%;
  height: 100%;
  max-width: 450px;
  margin: 0 auto;
  background-color: #ffffff;
`;

function App() {
  return (
    <Suspense>
      <ResetStyle />
      <AppWrapper>
        <Layout>
          <Routes>
            <Route path="/" element={<MainPage />} />
          </Routes>
        </Layout>
      </AppWrapper>
    </Suspense>
  );
}

const AppWrapper = styled.div`
  width: 100%;
  height: 100vh;
  background-color: #cccccc;
`;

export default App;

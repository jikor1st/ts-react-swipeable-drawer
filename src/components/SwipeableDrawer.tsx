import { PropsWithChildren } from "react";
import styled from "styled-components";

interface SwipeableDrawerProps {}
function SwipeableDrawer({
  children,
}: PropsWithChildren<SwipeableDrawerProps>) {
  return <>{children}</>;
}

export default SwipeableDrawer;

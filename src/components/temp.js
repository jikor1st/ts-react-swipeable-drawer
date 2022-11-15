import React, { useEffect, useState, useRef } from "react";
// styled
import styled, { css } from "styled-components";

// constants
const DRAWER_STEP_STATE_IS_OPEN = "module/swipeable-drawer/open";
const DRAWER_STEP_STATE_IS_CLOSE = "module/swipeable-drawer/close";
const DRAWER_STEP_STATE_IS_CUSTOM = "module/swipeable-drawer/custom";

// INFO : 하단 네비게이션 z-index:9 설정 되어있음
const DRAWER_ZINDEX = 8;

const TO_FIXED_FLOAT_DIGIT = 2;

const UNIT = "px";

const INITIAL_OPTIONS_STATE = {
  expand: 0,
  activePercentMovementY: 50,
  drawerPaddingTop: 20,
  drawerTransition: {
    timeType: "ms",
    duration: 195,
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
    delay: 0,
  },
};

const INITIAL_RECT_REF = {
  window: {
    width: 0,
    height: 0,
  },
  drawer: {
    width: 0,
    height: 0,
    closeExpandPercent: 0,
    closeExpand: 0,
  },
};
const INITIAL_POINT_REF = {
  down: {
    y: 0,
  },
  move: {
    y: 0,
  },
  up: {
    y: 0,
  },
  reduce: {
    y: 0,
  },
};
let debounceTimerScrolling = null;
const debounceScrolling = (callback, millseconds) => {
  if (debounceTimerScrolling) {
    clearTimeout(debounceTimerScrolling);
  }
  debounceTimerScrolling = setTimeout(() => {
    callback();
  }, millseconds ?? 500);
};

let debounceTimerResizing = null;
const debounceResizing = (callback, millseconds) => {
  if (debounceTimerResizing) {
    clearTimeout(debounceTimerResizing);
  }
  debounceTimerResizing = setTimeout(() => {
    callback();
  }, millseconds ?? 500);
};

// utils
const utils = {
  toFixedFloat: (value, digit) => {
    return parseFloat(value.toFixed(digit ?? TO_FIXED_FLOAT_DIGIT));
  },

  eventPointPosition: (event) => {
    if (event.type.includes("touch")) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    } else {
      return { x: event.clientX, y: event.clientY };
    }
  },
  elementTranslateYControll: (targetElement, { y }) => {
    targetElement.style.transform = `translateY(${utils.toFixedFloat(
      y
    )}${UNIT})`;
  },
  createTransitionString: ({ timeType, duration, ease, delay }) => {
    const durationTime = `${duration}${timeType}`;
    const delayTime = `${delay}${timeType}`;
    return `all ${durationTime} ${ease} ${delayTime}`;
  },
  elementTransitionControll: (targetElement, { option, use = true }) => {
    if (use) {
      targetElement.style.transition = option;
    } else {
      const transitionKey = "transition";
      if (targetElement.style.removeProperty) {
        targetElement.style.removeProperty(transitionKey);
      } else {
        targetElement.style.removeAttribute(transitionKey);
      }
    }
  },
  calcPercent: (movePoint, relativePoint, relativeSize) => {
    return ((movePoint - relativePoint) / relativeSize) * 100;
  },
};

export default function SwipeableDrawer({
  children,
  drawerController,
  initialOptions,
  ...props
}) {
  const { onDrawerControllerEnd, onDrawerOpen, onDrawerClose, onDrawerCustom } =
    props ?? {};
  const [isInitialSettingsDone, setIsInitialSettingsDone] = useState(false);
  const isInitialDrawerRenderingDoneRef = useRef(false);

  // element information
  const hasScrollElsRef = useRef([]);
  const isHasScrollElScrollingRef = useRef(false);
  const drawerElRef = useRef(null);
  const rectRef = useRef(INITIAL_RECT_REF);

  // variant
  const [initialOptionsState] = useState({
    ...INITIAL_OPTIONS_STATE,
    ...initialOptions,
  });

  const isDownRef = useRef(false);
  const drawerStateRef = useRef(
    drawerController === true
      ? DRAWER_STEP_STATE_IS_OPEN
      : drawerController === false
      ? DRAWER_STEP_STATE_IS_CLOSE
      : DRAWER_STEP_STATE_IS_CUSTOM
  );
  const pointRef = useRef(INITIAL_POINT_REF);

  useEffect(() => {
    // drawerControll : 스와이퍼의 초기 값 컨트롤
    if (!drawerElRef.current) return;
    if (!isInitialSettingsDone) return;

    if (isInitialDrawerRenderingDoneRef.current === false) {
      utils.elementTransitionControll(drawerElRef.current, {
        use: false,
      });
    } else {
      const { drawerTransition } = initialOptionsState;
      utils.elementTransitionControll(drawerElRef.current, {
        option: utils.createTransitionString(drawerTransition),
      });
    }

    const { offsetHeight: drawerOffsetHeight } = drawerElRef.current;

    if (typeof drawerController === "boolean") {
      if (drawerController) {
        // drawer 열림
        pointRef.current.reduce.y = 0;
        utils.elementTranslateYControll(drawerElRef.current, { y: 0 });
      } else {
        // drawer 닫힘

        const { closeExpand: drawerCloseExpand } = rectRef.current.drawer;

        const relativeDrawerCloseExpand =
          drawerOffsetHeight - drawerCloseExpand;

        pointRef.current.reduce.y = relativeDrawerCloseExpand;
        utils.elementTranslateYControll(drawerElRef.current, {
          y: relativeDrawerCloseExpand,
        });
      }
    } else if (typeof drawerController === "number") {
      const toPixelDrawerController =
        ((100 - drawerController) * drawerOffsetHeight) / 100;
      pointRef.current.reduce.y = toPixelDrawerController;
      drawerStateRef.current = DRAWER_STEP_STATE_IS_CUSTOM;
      utils.elementTranslateYControll(drawerElRef.current, {
        y: toPixelDrawerController,
      });
    }
    if (typeof onDrawerControllerEnd === "function") {
      onDrawerControllerEnd({
        pointerY: pointRef.current.reduce.y,
      });
    }

    isInitialDrawerRenderingDoneRef.current = true;
  }, [drawerController, isInitialSettingsDone]);

  // handler

  const handleDrawerPointerDown = () => {
    // 클릭 시 : down상태
    isDownRef.current = true;
  };

  const handleWindowPointerDown = (event) => {
    // window down
    const { y: pointerDownY } = utils.eventPointPosition(event);
    pointRef.current.down.y = pointerDownY;
  };

  const handleWindowPointerMove = (event) => {
    // window move
    if (isDownRef.current === false) return;
    if (isHasScrollElScrollingRef.current === true) return;

    const { offsetHeight: drawerOffsetHeight } = drawerElRef.current;
    const { y: pointerMoveY } = utils.eventPointPosition(event);
    const { y: pointerDownY } = pointRef.current.down;
    const { y: pointerReduceY } = pointRef.current.reduce;
    const { closeExpand: drawerCloseExpand } = rectRef.current.drawer;

    // 마우스 move값 - 처음 클릭 마우스 move값 + 이전 move값
    let calcMoveY = pointerMoveY - pointerDownY + pointerReduceY;

    // limit
    if (calcMoveY <= 0) {
      calcMoveY = 0;
      drawerStateRef.current = DRAWER_STEP_STATE_IS_OPEN;
      if (typeof onDrawerOpen === "function") {
        onDrawerOpen();
      }
    }
    if (calcMoveY >= drawerOffsetHeight - drawerCloseExpand) {
      calcMoveY = drawerOffsetHeight - drawerCloseExpand;
      drawerStateRef.current = DRAWER_STEP_STATE_IS_CLOSE;
      if (typeof onDrawerClose === "function") {
        onDrawerClose();
      }
    }
    pointRef.current.move.y = calcMoveY;

    utils.elementTransitionControll(drawerElRef.current, { use: false });
    utils.elementTranslateYControll(drawerElRef.current, { y: calcMoveY });
  };

  const handleWindowPointerUp = (event) => {
    // window up
    if (isDownRef.current === false) return;

    const { activePercentMovementY, drawerTransition } = initialOptionsState;
    const { closeExpand: drawerCloseExpand, height: drawerElHeight } =
      rectRef.current.drawer;

    const { y: pointerMoveY } = pointRef.current.move;
    const { y: pointerDownY } = pointRef.current.down;

    let calcMoveY = pointerMoveY;

    let percentMovementY = utils.calcPercent(pointerMoveY, 0, drawerElHeight);
    // limit
    if (activePercentMovementY >= percentMovementY) {
      // 다시 열림
      calcMoveY = 0;

      drawerStateRef.current = DRAWER_STEP_STATE_IS_OPEN;
    } else {
      // 다시 닫힘
      calcMoveY = drawerElHeight - drawerCloseExpand;

      drawerStateRef.current = DRAWER_STEP_STATE_IS_CLOSE;
    }
    pointRef.current.reduce.y = calcMoveY;

    // element transform/transition
    utils.elementTransitionControll(drawerElRef.current, {
      option: utils.createTransitionString(drawerTransition),
    });
    utils.elementTranslateYControll(drawerElRef.current, { y: calcMoveY });

    // 값 초기화
    pointRef.current.down.y = 0;
    pointRef.current.move.y = 0;
    isDownRef.current = false;
  };

  const handleDrawerTransitionEnd = () => {
    // 트랜지션이 끝나는 시점 감지
    if (drawerStateRef.current === DRAWER_STEP_STATE_IS_OPEN) {
      if (typeof onDrawerOpen === "function") {
        onDrawerOpen();
      }
    } else if (drawerStateRef.current === DRAWER_STEP_STATE_IS_CLOSE) {
      if (typeof onDrawerClose === "function") {
        onDrawerClose();
      }
    } else if (drawerStateRef.current === DRAWER_STEP_STATE_IS_CUSTOM) {
      if (typeof onDrawerCustom === "function") {
        onDrawerCustom();
      }
    }
    utils.elementTransitionControll(drawerElRef.current, { use: false });
  };

  const handleHasScrollElScrolling = () => {
    // 스크롤 시 스와이프를 막습니다.
    debounceScrolling(() => {
      isHasScrollElScrollingRef.current = false;
    }, 500);
    isHasScrollElScrollingRef.current = true;
    utils.elementTranslateYControll(drawerElRef.current, { y: 0 });
  };

  const handleWindowResizeToResetting = () => {
    // 만약이라도 윈도우 리사이즈 시 값 재 세팅
    debounceResizing(() => {
      initInformationSettings();
    }, 500);
  };

  const initInformationSettings = () => {
    // 초기 세팅 : onMount에서 실행
    const { offsetHeight: drawerOffsetHeight } = drawerElRef.current;
    const { expand: initialOptionsExpand } = initialOptionsState;

    // drawer inform setting
    rectRef.current.drawer.height = drawerOffsetHeight;
    // window inform setting
    rectRef.current.window.height = window.innerHeight;

    // expand inform setting
    rectRef.current.drawer.closeExpand = initialOptionsExpand;
  };

  const addEvent = () => {
    window.addEventListener("resize", handleWindowResizeToResetting);
    // pointer
    document.addEventListener("mousedown", handleWindowPointerDown);
    document.addEventListener("movemove", handleWindowPointerMove);
    document.addEventListener("mouseup", handleWindowPointerUp);
    document.addEventListener("touchstart", handleWindowPointerDown);
    document.addEventListener("touchmove", handleWindowPointerMove);
    document.addEventListener("touchend", handleWindowPointerUp);

    // children scroll
    if (drawerElRef.current === null) return;
    const selectAllDrawerElChildren = drawerElRef.current.querySelectorAll("*");
    const selectHasScrollEls = [];
    selectAllDrawerElChildren.forEach((element) => {
      const { clientHeight, scrollHeight } = element;
      const isElementHasScroll = clientHeight < scrollHeight;
      if (isElementHasScroll) {
        selectHasScrollEls.push(element);
      }
    });
    selectHasScrollEls.forEach((element) => {
      element.addEventListener("scroll", handleHasScrollElScrolling, {
        passive: true,
      });
    });
    hasScrollElsRef.current = selectHasScrollEls;
  };
  const removeEvent = () => {
    window.removeEventListener("resize", handleWindowResizeToResetting);
    // pointer
    document.removeEventListener("mousedown", handleWindowPointerDown);
    document.removeEventListener("movemove", handleWindowPointerMove);
    document.removeEventListener("mouseup", handleWindowPointerUp);
    document.removeEventListener("touchstart", handleWindowPointerDown);
    document.removeEventListener("touchmove", handleWindowPointerMove);
    document.removeEventListener("touchend", handleWindowPointerUp);

    // children scroll
    hasScrollElsRef.current.forEach((element) => {
      element.removeEventListener("scroll", handleHasScrollElScrolling, {
        passive: true,
      });
    });
  };

  const onMount = () => {
    // 컴포넌트 로드 시
    initInformationSettings();
    addEvent();
    // 초기 세팅 완료 시 state 변환
    setIsInitialSettingsDone(true);
  };
  const unMount = () => {
    // 컴포넌트 언로드 시
    removeEvent();
  };

  useEffect(() => {
    onMount();
    return () => {
      unMount();
    };
  }, []);

  return (
    <FixedContainer>
      <Background />
      <DrawerWrapper
        onTransitionEnd={handleDrawerTransitionEnd}
        onMouseDown={handleDrawerPointerDown}
        onTouchStart={handleDrawerPointerDown}
        ref={drawerElRef}
        paddingTop={initialOptionsState.drawerPaddingTop}
      >
        <MobileBar />
        {children}
      </DrawerWrapper>
    </FixedContainer>
  );
}

// use styled
const FixedContainer = styled.div`
  position: fixed;
  top: auto;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: ${DRAWER_ZINDEX};
  pointer-events: none;
`;
const Background = styled.div``;
const DrawerWrapper = styled.section`
  box-sizing: border-box;
  position: fixed;
  top: auto;
  left: 0;
  bottom: 0;
  right: 0;
  background: #ffffff;
  border-radius: 20px 20px 0;
  will-change: transform;
  pointer-events: auto;
  touch-action: none;
  ${({ paddingTop }) =>
    css`
      padding-top: ${paddingTop};
    `}
`;
const MobileBar = styled.div`
  display: block;
  width: 50px;
  height: 4px;
  border-radius: 2px;
  background: rgb(246, 246, 246);
  position: absolute;
  left: 50%;
  top: 10px;
  transform: translateX(-50%);
  z-index: 10;
`;

import { ref, onMounted, onUnmounted, type Ref } from "vue";

export function useTouch(element: Ref<HTMLElement | null>) {
  const startX = ref(0);
  const startY = ref(0);
  const moveX = ref(0);
  const moveY = ref(0);
  const isSwiping = ref(false);

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    startX.value = touch.clientX;
    startY.value = touch.clientY;
    isSwiping.value = false;
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!element.value) return;
    const touch = event.touches[0];
    moveX.value = touch.clientX - startX.value;
    moveY.value = touch.clientY - startY.value;

    if (!isSwiping.value) {
      isSwiping.value = Math.abs(moveX.value) > Math.abs(moveY.value);
    }

    if (isSwiping.value) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    startX.value = 0;
    startY.value = 0;
    moveX.value = 0;
    moveY.value = 0;
    isSwiping.value = false;
  };

  onMounted(() => {
    const target = element.value;
    if (!target) return;
    target.addEventListener("touchstart", handleTouchStart, { passive: false });
    target.addEventListener("touchmove", handleTouchMove, { passive: false });
    target.addEventListener("touchend", handleTouchEnd);
  });

  onUnmounted(() => {
    const target = element.value;
    if (!target) return;
    target.removeEventListener("touchstart", handleTouchStart);
    target.removeEventListener("touchmove", handleTouchMove);
    target.removeEventListener("touchend", handleTouchEnd);
  });

  return {
    startX,
    startY,
    moveX,
    moveY,
    isSwiping,
  };
}

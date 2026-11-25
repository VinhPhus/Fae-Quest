/**
 * Điều phối hiệu ứng Vật Phẩm Bay Vòng Cung Bezier (#442) giữa RewardShopHeader & RewardShopGrid.
 */

export interface FlyPayload {
  sourceEl: HTMLElement | null;
  emoji: string;
  title: string;
  isSystem: boolean;
}

type FlyListener = (payload: FlyPayload) => void;
type HitListener = (itemTitle: string) => void;

const flyListeners = new Set<FlyListener>();
const hitListeners = new Set<HitListener>();

let headerBagTarget: HTMLElement | null = null;
let floatingBagTarget: HTMLElement | null = null;
let isHeaderBagVisible = true;

export function registerHeaderBagTarget(el: HTMLElement | null) {
  headerBagTarget = el;
}

export function registerFloatingBagTarget(el: HTMLElement | null) {
  floatingBagTarget = el;
}

export function setHeaderBagVisibility(visible: boolean) {
  isHeaderBagVisible = visible;
}

export function resolveActiveBagTarget(): HTMLElement | null {
  if (isHeaderBagVisible && headerBagTarget) {
    const rect = headerBagTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return headerBagTarget;
    }
  }
  if (floatingBagTarget) {
    const rect = floatingBagTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return floatingBagTarget;
    }
  }
  return headerBagTarget || floatingBagTarget;
}

export function subscribeFlyRequests(fn: FlyListener): () => void {
  flyListeners.add(fn);
  return () => flyListeners.delete(fn);
}

export function triggerShopFlyToBag(payload: FlyPayload) {
  flyListeners.forEach((fn) => fn(payload));
}

export function subscribeBagHits(fn: HitListener): () => void {
  hitListeners.add(fn);
  return () => hitListeners.delete(fn);
}

export function notifyBagHit(itemTitle: string) {
  hitListeners.forEach((fn) => fn(itemTitle));
}

import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';

function createCurvedTrapezoidPathD(
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number,
  radius: number
) {
  const w = totalWidth - radius;
  const tw = totalHeight / 4;
  const points = [
    { x: x + w, y },
    { x: x + tw, y },
    { x: x, y: y + totalHeight / 2 },
    { x: x + tw, y: y + totalHeight },
    { x: x + w, y: y + totalHeight },
  ];
  const rectPath = createPathFromPoints(points);
  const arcPath = `M ${w},0 A ${totalHeight / 2} ${totalHeight / 2} 0 0 1 ${w} ${totalHeight}`;
  const finalPath = `${rectPath} ${arcPath}`.replace('Z', '');
  return finalPath;
}

export const curvedTrapezoid = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox } = await labelHelper(parent, node, getNodeClasses(node));
  const widthMultiplier = bbox.width < 15 ? 2 : 1.25;
  const w = (bbox.width + node.padding) * widthMultiplier;
  const h = bbox.height + node.padding;
  const radius = h / 2;

  const { cssStyles } = node;
  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const pathData = createCurvedTrapezoidPathD(0, 0, w, h, radius);
  const shapeNode = rc.path(pathData, options);

  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles) {
    polygon.attr('style', cssStyles);
  }
  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  polygon.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, polygon);

  node.intersect = function (point) {
    const pos = intersect.rect(node, point);
    return pos;
  };

  return shapeSvg;
};
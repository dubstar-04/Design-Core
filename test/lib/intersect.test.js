import { Point } from '../../core/entities/point.js';
import { Intersection } from '../../core/lib/intersect';

test('Test Intersection.intersectCircleEllipse()', () => {
  expect(true).toBeTruthy();
  // TODO: intersectCircleEllipse
});

test('Test intersectSegmentSegment - circle line', () => {
  // CCW semicircular arc from (10,0) to (-10,0) with bulge=1
  // centre (0,0), radius 10, passes through (0,10)
  // Vertical line from (0,-15) to (0,15) crosses the arc at (0,10)
  const result = Intersection.intersectSegmentSegment(
      new Point(10, 0, 1), new Point(-10, 0),
      new Point(0, -15), new Point(0, 15),
      false,
  );
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(10);
});

test('Test intersectSegmentSegment - tangent arc line', () => {
  // CCW semicircular arc from (10,0) to (-10,0), centre (0,0), radius 10
  // Horizontal line y=10 is tangent to the top of the arc at (0,10)
  const result = Intersection.intersectSegmentSegment(
      new Point(10, 0, 1), new Point(-10, 0),
      new Point(-15, 10), new Point(15, 10),
      false,
  );
  expect(result.status).toBe('Tangent');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(10);
});

test('Test intersectSegmentSegment - concentric arcs same radius', () => {
  // Two semicircular arcs with the same centre and radius
  const result = Intersection.intersectSegmentSegment(
      new Point(10, 0, 1), new Point(-10, 0),
      new Point(0, 10, 1), new Point(0, -10),
      false,
  );
  expect(result.status).toBe('Coincident');
  expect(result.points.length).toBe(0);
});

test('Test intersectSegmentSegment - concentric arcs different radius', () => {
  // Two semicircular arcs with the same centre but different radii
  const result = Intersection.intersectSegmentSegment(
      new Point(10, 0, 1), new Point(-10, 0),
      new Point(5, 0, 1), new Point(-5, 0),
      false,
  );
  expect(result.status).toBe('Inside');
  expect(result.points.length).toBe(0);
});

test('Test intersectSegmentSegment - line line', () => {
  // Crossing - segments cross in their interiors
  const result = Intersection.intersectSegmentSegment(
      new Point(), new Point(0, 10),
      new Point(-5, 5), new Point(5, 5),
      false,
  );
  expect(result.status).toBe('Perpendicular');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Crossing - non-perpendicular crossing
  const resultCross = Intersection.intersectSegmentSegment(
      new Point(0, 0), new Point(10, 5),
      new Point(0, 5), new Point(10, 0),
      false,
  );
  expect(resultCross.status).toBe('Crossing');

  // Crossing - Extend (perpendicular - vertical boundary, horizontal selected extended)
  const result1 = Intersection.intersectSegmentSegment(
      new Point(), new Point(0, 10),
      new Point(1, 5), new Point(5, 5),
      true,
  );
  expect(result1.status).toBe('Perpendicular');
  expect(result1.points.length).toBe(1);
  expect(result1.points[0].x).toBeCloseTo(0);
  expect(result1.points[0].y).toBeCloseTo(5);

  // No Intersection - Parallel
  const result2 = Intersection.intersectSegmentSegment(
      new Point(), new Point(0, 10),
      new Point(1, 0), new Point(1, 10),
      false,
  );
  expect(result2.status).toBe('Parallel');
  expect(result2.points.length).toBe(0);

  // Touching - endpoint of one segment lies on interior of the other
  const result3 = Intersection.intersectSegmentSegment(
      new Point(), new Point(0, 10),
      new Point(0, 1), new Point(0, 8),
      false,
  );
  expect(result3.status).toBe('Touching');
  expect(result3.points.length).toBe(1);

  // No Intersection - Collinear but disjoint (no overlap)
  const result4 = Intersection.intersectSegmentSegment(
      new Point(0, 0), new Point(0, 5),
      new Point(0, 7), new Point(0, 10),
      false,
  );
  expect(result4.status).toBe('None');
  expect(result4.points.length).toBe(0);

  // Endpoint - segments share an endpoint
  const result5 = Intersection.intersectSegmentSegment(
      new Point(0, 0), new Point(0, 10),
      new Point(0, 10), new Point(10, 10),
      false,
  );
  expect(result5.status).toBe('Endpoint');
  expect(result5.points.length).toBe(1);
  expect(result5.points[0].x).toBeCloseTo(0);
  expect(result5.points[0].y).toBeCloseTo(10);
});

test('Test intersectPolylinePolyline - polyline line', () => {
  // Intersection
  let points = [new Point(), new Point(0, 10)];
  let polyline = points;
  let line = [new Point(-10, 5), new Point(10, 5)];

  // Test polyline with single segment
  let result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with multiple segments
  points.push(new Point(2, 10), new Point(2, 0));
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[1].x).toBeCloseTo(2);
  expect(result.points[1].y).toBeCloseTo(5);

  // No Intersection
  const line2 = [new Point(5, 0), new Point(5, 10)];
  result = Intersection.intersectPolylinePolyline(polyline, line2, false);
  expect(result.status).toBe('None');
  expect(result.points.length).toBe(0);

  // Test polyline with 180 degree arc segment - 270 - 90 - negative bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(0, 0, -1), new Point(0, 10)];
  polyline = points;
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(-5);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment - 270 - 90 - positive bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(0, 0, 1), new Point(0, 10)];
  polyline = points;
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(5);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment 180 - 0 - negative bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(-5, 5, -1), new Point(5, 5)];
  polyline = points;
  line = [new Point(-10, 5), new Point(10, 5)];
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(5);
  expect(result.points[0].y).toBeCloseTo(5);
  expect(result.points[1].x).toBeCloseTo(-5);
  expect(result.points[1].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment 180 - 0 - positive bulge
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(-5, 5, 1), new Point(5, 5)];
  polyline = points;
  line = [new Point(-10, 5), new Point(10, 5)];
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(2);
  expect(result.points[0].x).toBeCloseTo(5);
  expect(result.points[0].y).toBeCloseTo(5);
  expect(result.points[1].x).toBeCloseTo(-5);
  expect(result.points[1].y).toBeCloseTo(5);

  // Test polyline with 180 degree arc segment 180 - 0 - negative bulge - offset line
  // counter clockwise bulge = +ve, clockwise bulge = -ve
  // direction: - ccw > 0, cw <= 0
  points = [new Point(-5, 5, -1), new Point(5, 5)];
  polyline = points;
  line = [new Point(0, 7), new Point(10, 7)];
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(4.5826);
  expect(result.points[0].y).toBeCloseTo(7);

  // Test polyline with 180 degree arc segment 180 - 0 - positive bulge - offset line
  // counter clockwise bulge = +ve, clockwise bulge = -ve,
  points = [new Point(-5, 5, 1), new Point(5, 5)];
  polyline = points;
  line = [new Point(0, 7), new Point(10, 7)];
  result = Intersection.intersectPolylinePolyline(polyline, line, false);
  expect(result.status).toBe('None');
  expect(result.points.length).toBe(0);
});

test('Test intersectPolylinePolyline with rectangle polyline', () => {
  const points = [new Point(-5, 5), new Point(5, 5)];
  const polyline = points;
  const rectangle = [new Point(), new Point(25, 0), new Point(25, 25), new Point(0, 25), new Point()];

  // Test polyline with single segment
  const result = Intersection.intersectPolylinePolyline(polyline, rectangle, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(5);

  // Test polyline with multiple segments
  points.push(new Point(5, 20), new Point(30, 20));
  const result2 = Intersection.intersectPolylinePolyline(polyline, rectangle, false);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBe(2);
  expect(result2.points[0].x).toBeCloseTo(0);
  expect(result2.points[0].y).toBeCloseTo(5);
  expect(result2.points[1].x).toBeCloseTo(25);
  expect(result2.points[1].y).toBeCloseTo(20);

  // Overlapping collinear segments
  const points2 = [new Point(5, 5), new Point(20, 20)];
  const polyline2 = points2;
  const result3 = Intersection.intersectPolylinePolyline(polyline2, [new Point(), new Point(25, 25)], false);
  expect(result3.status).toBe('Intersection');
  expect(result3.points.length).toBe(1);
});

test('Test intersectPolylinePolyline - polyline arc', () => {
  // Intersection - polyline(boundary) vs arc segment(selected)
  const polyline = [new Point(), new Point(0, 25)];
  // Arc segment from (10,10) to (-10,10) with bulge=1
  // This creates a CCW semicircular arc with centre (0,10), radius 10
  const arcPolyline = [new Point(10, 10, 1), new Point(-10, 10)];
  const result = Intersection.intersectPolylinePolyline(polyline, arcPolyline, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(20);
});

test('Test Intersection.intersectPolylinePolyline()', () => {
  // Two crossing polylines with line segments
  const polyline1 = [new Point(-10, 0), new Point(10, 0)];
  const polyline2 = [new Point(0, -10), new Point(0, 10)];

  const result = Intersection.intersectPolylinePolyline(polyline1, polyline2, false);
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(0);
  expect(result.points[0].y).toBeCloseTo(0);

  // No intersection
  const polyline3 = [new Point(20, 0), new Point(30, 0)];
  const result2 = Intersection.intersectPolylinePolyline(polyline1, polyline3, false);
  expect(result2.status).toBe('None');
  expect(result2.points.length).toBe(0);

  // Polyline with arc segment intersecting a line-segment polyline
  // CCW arc from (-5,0) to (5,0) with bulge=1 goes through (0,-5)
  const polyline4 = [new Point(-5, 0, 1), new Point(5, 0)];
  const polyline5 = [new Point(0, -10), new Point(0, -3)];

  const result3 = Intersection.intersectPolylinePolyline(polyline4, polyline5, false);
  expect(result3.status).toBe('Intersection');
  expect(result3.points.length).toBe(1);
  expect(result3.points[0].x).toBeCloseTo(0);
  expect(result3.points[0].y).toBeCloseTo(-5);
});

test('Test intersectPolylinePolyline - polyline arc with extend', () => {
  // Arc: quarter circle from (10,0) to (0,10) centred at origin, radius 10, CCW
  // Represent as polyline with arc segment
  const arcPolyline = [new Point(10, 0, 1), new Point(0, 10)];

  // Polyline crossing the arc
  const polyline = [new Point(0, 0), new Point(15, 15)];

  // Without extend - intersection should be on the arc
  const result1 = Intersection.intersectPolylinePolyline(polyline, arcPolyline, false);
  expect(result1.status).toBe('Intersection');
  expect(result1.points.length).toBe(1);

  // With extend - all circle intersections returned (not filtered by arc bounds)
  const result2 = Intersection.intersectPolylinePolyline(polyline, arcPolyline, true);
  expect(result2.status).toBe('Intersection');
  expect(result2.points.length).toBeGreaterThanOrEqual(1);
});

test('Test Intersection.intersectRayRay()', () => {
  // Perpendicular lines meeting at origin
  const p1 = Intersection.intersectRayRay(
      new Point(-5, 0), new Point(5, 0),
      new Point(0, -5), new Point(0, 5),
  );
  expect(p1).not.toBeNull();
  expect(p1.x).toBeCloseTo(0);
  expect(p1.y).toBeCloseTo(0);

  // Non-perpendicular: lines y=1 and x=1 meeting at (1, 1)
  const p2 = Intersection.intersectRayRay(
      new Point(0, 1), new Point(10, 1),
      new Point(1, 0), new Point(1, 10),
  );
  expect(p2).not.toBeNull();
  expect(p2.x).toBeCloseTo(1);
  expect(p2.y).toBeCloseTo(1);

  // 45-degree lines crossing at (5, 5)
  const p3 = Intersection.intersectRayRay(
      new Point(0, 0), new Point(10, 10),
      new Point(10, 0), new Point(0, 10),
  );
  expect(p3).not.toBeNull();
  expect(p3.x).toBeCloseTo(5);
  expect(p3.y).toBeCloseTo(5);

  // Parallel lines — should return null
  const p4 = Intersection.intersectRayRay(
      new Point(0, 0), new Point(10, 0),
      new Point(0, 1), new Point(10, 1),
  );
  expect(p4).toBeNull();
});

// ------------------------------------------------------------
// intersectSegmentSegment — circle/arc vs line, non-origin centre
// These tests specifically exercise the numerical stability fix:
// computing centreToStart = a1 - c before squaring avoids
// floating-point cancellation that occurs when the expanded form
// a1² + c² - 2·a1·c is used with an off-origin circle centre.
// ------------------------------------------------------------

test('intersectSegmentSegment - arc vs line, non-origin centre, two intersections', () => {
  // Circle centred at (1000, 1000), radius 50.
  // Top point: (1000, 1050), bottom: (1000, 950).
  // Left semicircle arc: top → bottom with bulge=1 (CCW).
  // Horizontal line through centre: (950, 1000) → (1050, 1000).
  // The line is a chord spanning the full diameter; the left half
  // intersects once at (950, 1000) and the right half at (1050, 1000).
  const leftArcStart = new Point(1000, 1050, 1);
  const leftArcEnd = new Point(1000, 950);

  const lineStart = new Point(950, 1000);
  const lineEnd = new Point(1050, 1000);

  // arc(boundary) vs line(selected)
  const result = Intersection.intersectSegmentSegment(
      leftArcStart, leftArcEnd,
      lineStart, lineEnd,
      false,
  );
  // Only the point on the left semicircle passes the arc filter
  expect(result.status).toBe('Intersection');
  expect(result.points.length).toBe(1);
  expect(result.points[0].x).toBeCloseTo(950);
  expect(result.points[0].y).toBeCloseTo(1000);
});

test('intersectSegmentSegment - arc vs line, non-origin centre, line outside arc', () => {
  // Same circle at (1000, 1000) radius 50.
  // Line entirely to the right of centre: (1060, 900) → (1060, 1100).
  // This line is outside the circle entirely.
  const arcStart = new Point(1000, 1050, 1);
  const arcEnd = new Point(1000, 950);

  const result = Intersection.intersectSegmentSegment(
      arcStart, arcEnd,
      new Point(1060, 900), new Point(1060, 1100),
      false,
  );
  expect(result.status).toBe('Outside');
  expect(result.points.length).toBe(0);
});

test('intersectSegmentSegment - arc vs line, non-origin centre, line inside circle', () => {
  // Same circle at (1000, 1000) radius 50.
  // Short line fully inside the circle: (1000, 990) → (1000, 1010).
  // The circle-line quadratic yields two roots outside [0,1];
  // one u<0 and one u>1 → INSIDE status, no points without extend.
  const arcStart = new Point(1000, 1050, 1);
  const arcEnd = new Point(1000, 950);

  const result = Intersection.intersectSegmentSegment(
      arcStart, arcEnd,
      new Point(1000, 990), new Point(1000, 1010),
      false,
  );
  expect(result.status).toBe('Inside');
  expect(result.points.length).toBe(0);
});

test('intersectPolylinePolyline - full circle vs diameter line, non-origin centre', () => {
  // Reproduces the real-world trim failure:
  // Circle centred at (588.75, 354.25), radius 78.136.
  // The line connecting the two points where it intersects the
  // circle is a near-diameter, with large absolute coordinates.
  // Prior to the fix the discriminant underflowed to 0 or negative
  // due to floating-point cancellation, returning no intersections.
  const cx = 588.7494381894326;
  const cy = 354.25057706935644;
  const r = 78.13609384123743;

  // Circle represented as two CCW semicircular arc segments (matching
  // Circle.toPolylinePoints() output):
  //   top = centre.project(0,  r)  →  (cx, cy + r)
  //   bot = centre.project(0, -r)  →  (cx, cy - r)
  const top = new Point(cx, cy + r, 1); // left semicircle start
  const bot = new Point(cx, cy - r, 1); // right semicircle start
  const topClose = new Point(cx, cy + r); // closure point

  const circlePolyline = [top, bot, topClose];

  // The failing line from the DXF file — a near-diameter of the circle.
  const linePolyline = [
    new Point(644, 299.00001525878906),
    new Point(533.4988763788651, 409.5011388799238),
  ];

  const result = Intersection.intersectPolylinePolyline(linePolyline, circlePolyline, false);
  expect(result.status).toBe('Intersection');
  // The line passes through both halves of the circle, yielding two points.
  expect(result.points.length).toBe(2);
  // Each intersection point must lie approximately on the circle.
  for (const pt of result.points) {
    const dist = Math.sqrt((pt.x - cx) ** 2 + (pt.y - cy) ** 2);
    expect(dist).toBeCloseTo(r, 3);
  }
});

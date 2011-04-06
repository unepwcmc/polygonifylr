class Polygon < ActiveRecord::Base
  MAX_AREA_KM2 = 9000
  DEFAULT_SRID = 4326

  def self.geojson_data id
    ActiveRecord::Base.connection.select_one(
    "SELECT id, x(ST_PointOnSurface(geometry::geometry)) as lng,
              y(ST_PointOnSurface(geometry::geometry)) as lat,
              ST_AsGeoJSON(geometry::geometry,6,0) as geojson
              FROM polygons AS p
              WHERE p.id=#{id}"
    )
  end
end

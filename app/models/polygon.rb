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

  # todo: multiple geometries?
  def self.create_from_geojson! (geojson)
    polygon_wkt = GeomHelper.geojson_to_wkt geojson
    validate_max_area polygon_wkt
    wkb = ActiveRecord::Base.connection.execute("SELECT ST_GeomFromText('#{polygon_wkt}')")
    Polygon.create! :geometry => wkb.getvalue(0, 0)
  end

  def self.validate_max_area polygon_wkt, srid = DEFAULT_SRID
    area = ActiveRecord::Base.connection.select_value("SELECT (ST_Area(ST_Transform(ST_GeomFromText('#{polygon_wkt}',#{srid}),954009)))").to_i
    area = area / 1000000 .to_i
    if area <= MAX_AREA_KM2
      return true
    end
    raise "Your polygon is too large (#{area} km2), please limit its area to #{MAX_AREA_KM2} km2."
    redirect_to root_url
  end
end

module PolygonsHelper
  # todo: multiple geometries?
  def self.parse_geom geojson
    polygon_wkt = GeomHelper.geojson_to_wkt geojson
    validate_max_area polygon_wkt
    wkb = ActiveRecord::Base.connection.execute("SELECT ST_GeomFromText('#{polygon_wkt}')")
    wkb.getvalue(0, 0)
  end

  def self.validate_max_area polygon_wkt, srid = Polygon::DEFAULT_SRID
    area = ActiveRecord::Base.connection.select_value("SELECT (ST_Area(ST_Transform(ST_GeomFromText('#{polygon_wkt}',#{srid}),954009)))").to_i
    area = area / 1000000 .to_i
    if area <= Polygon::MAX_AREA_KM2
      return true
    end
    raise "Your polygon is too large (#{area} km2), please limit its area to #{Polygon::MAX_AREA_KM2} km2."
    redirect_to root_url
  end
end

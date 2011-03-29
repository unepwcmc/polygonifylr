class Polygon < ActiveRecord::Base
  MAX_AREA_KM2 = 25

  def self.create_from_geojson (geojson)
    polygon_wkt = GeomHelper.geojson_to_wkt geojson
    validate_max_area polygon_wkt
    wkb = ActiveRecord::Base.connection.execute("SELECT ST_GeomFromText('#{polygon_wkt}')")
    # todo: multiple geometries?
    Polygon.create :geometry => wkb.getvalue(0, 0)
  end

  def self.validate_max_area polygon_wkt, srid = GeoRuby::SimpleFeatures::DEFAULT_SRID
    area = ActiveRecord::Base.connection.select_value("SELECT (ST_Area(ST_Transform(ST_GeomFromText('#{polygon_wkt}',#{srid}),954009)))").to_i
    area = area / 1000000 .to_i
    if area <= MAX_AREA_KM2
      return true
    end
    raise "Your polygon is too large (#{area} km2), please limit its area to #{Tenement::MAX_POLYGON_AREA_KM2} km2."
    redirect_to root_url
  end


  # call ppe web service, get results and store locally
  def analysePolygon(geojson, data_sources = ["protected_areas"])
    raise "Not implemented"
  end
end

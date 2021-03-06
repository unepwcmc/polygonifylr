class PolygonsController < ApplicationController
  # GET /polygons
  def index
    @polygons = Polygon.all
  end

  # GET /polygons/new
  def new
    @polygon = Polygon.new

    @submission_url = "/polygons"
    @submission_http_verb = "POST"

    render :action => :new, :layout => "map"
  end

  # GET /polygons/1/edit
  def edit
    id = params[:id]
    @geojson_data = Polygon.geojson_data(id).to_json

    @submission_url = "/polygons/#{id}"
    @submission_http_verb = "PUT"

    render :action => :edit, :layout => "map"
  end

  # POST /polygons
  def create
    begin
      @polygon = Polygon.create! :geometry => PolygonsHelper.parse_geom(params[:geometry])
    rescue Exception => e
      msg = "Polygon couldn't be uploaded: #{e.message}"
      Rails.logger.fatal "#{msg} (#{e.class})"
      render :json => {:error => msg}
    else
      render :json => {:id => @polygon.id}
    end
  end

  # PUT /polygons/1
  def update
    @polygon = Polygon.find(params[:id])


    begin
      @polygon.geometry = PolygonsHelper.parse_geom params[:geometry]
      @polygon.save!
    rescue Exception => e
      msg = "Polygon couldn't be saved: #{e.message}"
      Rails.logger.fatal "#{msg} (#{e.class})"
      render :json => {:error => msg}
    else
      render :json => {:id => @polygon.id}
    end
  end

  # DELETE /polygons/1
  def destroy
    @polygon = Polygon.find(params[:id])
    @polygon.destroy

    redirect_to(polygons_url)
  end
end

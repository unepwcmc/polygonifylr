class PolygonsController < ApplicationController
  # GET /polygons
  def index
    @polygons = Polygon.all
  end

  # GET /polygons/new
  def new
    @polygon = Polygon.new
    render :action => :new, :layout => "map"
  end

  # GET /polygons/1/edit
  def edit
    @geojson_data = Polygon.geojson_data(params[:id]).to_json
    render :action => :edit, :layout => "map"
  end

  # POST /polygons
  def create
    begin
      @polygon = Polygon.create_from_geojson!(params[:geometry])
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

    if @polygon.update_attributes(params[:polygon])
      redirect_to(@polygon, :notice => 'Polygon was successfully updated.')
    else
      render :action => "edit"
    end
  end

  # DELETE /polygons/1
  def destroy
    @polygon = Polygon.find(params[:id])
    @polygon.destroy

    redirect_to(polygons_url)
  end
end

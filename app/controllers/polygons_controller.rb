class PolygonsController < ApplicationController
  # GET /polygons
  # GET /polygons.xml
  def index
    @polygons = Polygon.all

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @polygons }
    end
  end

  # GET /polygons/1
  # GET /polygons/1.xml
  def show
    @polygon = Polygon.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @polygon }
    end
  end

  # GET /polygons/new
  # GET /polygons/new.xml
  def new
    @polygon = Polygon.new
    @mx_area_km2 = 10

    render :action => :new, :layout => "map"
  end

  # GET /polygons/1/edit
  def edit
    @polygon = Polygon.find(params[:id])
  end

  # POST /polygons
  def create
    begin
      @polygon = Polygon.create_from_geojson(params[:geojson])
    rescue
      msg = "Polygon couldn't be uploaded: #{e.message}"
      Rails.logger.fatal "#{msg} (#{e.class})"
      render :json => {:error => msg}
    else
      @polygon.analyse(params[:data], params[:sources])
      render :json => @polygon.as_json
    end
  end

  # PUT /polygons/1
  # PUT /polygons/1.xml
  def update
    @polygon = Polygon.find(params[:id])

    respond_to do |format|
      if @polygon.update_attributes(params[:polygon])
        format.html { redirect_to(@polygon, :notice => 'Polygon was successfully updated.') }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @polygon.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /polygons/1
  # DELETE /polygons/1.xml
  def destroy
    @polygon = Polygon.find(params[:id])
    @polygon.destroy

    respond_to do |format|
      format.html { redirect_to(polygons_url) }
      format.xml  { head :ok }
    end
  end
end

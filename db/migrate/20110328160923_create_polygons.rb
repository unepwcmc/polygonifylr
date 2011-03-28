class CreatePolygons < ActiveRecord::Migration
  def self.up
    create_table :polygons do |t|
      t.string :geometry

      t.timestamps
    end
  end

  def self.down
    drop_table :polygons
  end
end

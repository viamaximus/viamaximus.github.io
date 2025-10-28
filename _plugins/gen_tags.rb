# _plugins/generate_tags.rb
module GenerateTags
  class TagPage < Jekyll::Page
    def initialize(site, base, dir, tag)
      @site  = site
      @base  = base
      @dir   = dir
      @name  = "index.html"

      self.process(@name)
      self.read_yaml(File.join(base, "_layouts"), "tag.html")
      self.data["tag"] = tag
      self.data["title"] = "Tag: #{tag}"
      self.data["permalink"] = "/tag/#{Jekyll::Utils.slugify(tag)}/"
    end
  end

  class TagGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      return if site.tags.nil?

      site.tags.keys.each do |tag|
        slug = Jekyll::Utils.slugify(tag)
        site.pages << TagPage.new(site, site.source, File.join("tag", slug), tag)
      end
    end
  end
end



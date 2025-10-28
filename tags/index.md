---
layout: default
title: Tags
permalink: /tags/
---

<h1>All tags</h1>
<ul>
  {% assign sorted = site.tags | sort %}
  {% for tag in sorted %}
    {% assign name = tag[0] %}
    <li>
      <a href="{{ '/tag/' | append: name | slugify | append: '/' | relative_url }}">
        {{ name }}
      </a>
      <small>({{ tag[1].size }})</small>
    </li>
  {% endfor %}
</ul>


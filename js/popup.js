if (!String.prototype.hasOwnProperty('ucFirst')) {
    Object.defineProperty(String.prototype, 'ucFirst', {
        value: function() {
            var s = this.toString();
            return s[0].toUpperCase() + s.substring(1);
        }
    });
}

if (!String.prototype.hasOwnProperty('ucWords')) {
    Object.defineProperty(String.prototype, 'ucWords', {
        value: function() {
            var string = this.toString();
            const words = string.split(" ");

            for (let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toUpperCase() + words[i].substring(1);
            }

            return words.join(" ");
        }
    });
}

$(document).ready(function() {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
        chrome.storage.sync.get({sites: []}, function(data) {
            if (data.sites.length > 0) {
                var projects = [];
                var selected_project;
                var selected_site;

                data.sites.forEach(function(site) {
                    if (site.project == '') {
                        site.project = 'undefined';
                    }

                    if (projects[site.project] === undefined) {
                        projects[site.project] = [];
                    }
                    projects[site.project].push(site);
                });

                var current = tabs[0].url;

                var link = new URL(current);
                var domain = link.hostname;
                var origin = link.origin;

                var $projects = $('#projects');
                var $sites  = $('#sites');

                for (var project in projects) {
                    $('<option value="' + escape(project) + '">' + project + '</option>').appendTo($projects);

                    for (var s in projects[project]) {
                        var site = projects[project][s];
                        var selected = '';
                        var url = site.url;
                        if (url.indexOf('//') > -1) {
                            url = url.split('//')[1];
                        }

                        if (url.indexOf(domain) == 0) {
                            selected_project = project;
                            selected_site = site;

                            selected = ' class="selected"';
                        }

                        $('<li data-client="' + escape(project) + '"' + selected + '><a href="' + site.url + link.pathname + link.search + '">' + site.name + '</a></li>').appendTo($sites);
                    }
                }

                $projects.on('change', function() {
                    var client = $projects.val();

                    $sites.find('li').each(function() {
                        var $li = $(this);
                        if ($li.data('client') == client) {
                            $li.addClass('show');
                        } else {
                            $li.removeClass('show');
                        }
                    });
                });

                if (selected_project) {
                    $projects.val(escape(selected_project)).trigger('change');
                } else {
                    var $add = $('#add');
                    $add.css('display', 'block');

                    $add.on('click', function(e) {
                        e.preventDefault();

                        var parts = domain.split('.');
                        var project = parts[1];

                        if (parts[2] === 'local') {
                            parts[0] = '-- LOCAL --';
                        } else if (domain.indexOf('.d3r.') > -1) {
                            var stagingParts = parts[0].split('-');
                            parts[0] = stagingParts.shift() + ' - Staging';
                            stagingParts.pop();
                            project = stagingParts.join(' ');
                        } else {
                            // Assume its live
                            if (parts[0] === 'www') {
                                parts.shift();
                            }

                            project = parts[0];
                            parts[0] = '-- LIVE --';
                        }

                        var site = {
                            'name'    : parts[0].ucWords(),
                            'url'     : origin,
                            'project' : project.ucWords(),
                        };

                        data.sites.push(site);
                        chrome.storage.sync.set({sites: data.sites}, function() {
                            chrome.runtime.openOptionsPage();
                        });
                    });
                }

                if ($projects.find('option').length <= 2) {
                    $projects.hide();

                    if (!selected_project) {
                        $sites.find('li').addClass('show');
                    }
                }

                var redirect = 'redirect=' + encodeURIComponent(link.pathname);

                $('#debug_bar').on('click', function(e) {
                    var url = link.protocol + '//' + link.hostname + '/debug/enable?destination=bar&' + redirect;
                    chrome.tabs.update(tabs[0].id, {url: url});
                    window.close();
                });

                $('#debug_off').on('click', function(e) {
                    var url = link.protocol + '//' + link.hostname + '/debug/disable?' + redirect;
                    chrome.tabs.update(tabs[0].id, {url: url});
                    window.close();
                });

                var $edit = $('#edit');
                if (link.pathname.indexOf('/cp') > -1) {
                    $edit.hide();
                } else {
                    $edit.attr('href', link.protocol + '//' + link.hostname + '/cp' + link.pathname);
                }

                $('#sites').on('click', 'a', function() {
                    chrome.tabs.create({'url': this.href});
                });

                $('#edit').on('click', function(e) {
                    e.preventDefault();
                    chrome.tabs.create({'url': this.href});
                    window.close();
                });

                $('#options').on('click', function() {
                    chrome.runtime.openOptionsPage();
                });
            } else {
                chrome.runtime.openOptionsPage();
            }
        });
    });
});

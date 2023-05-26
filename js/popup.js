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

                var link = document.createElement("a");
                link.href = current;
                var domain = link.hostname;

                var $projects = $('#projects');
                var $sites  = $('#sites');

                for (var project in projects) {
                    $('<option value="' + escape(project) + '">' + project + '</option>').appendTo($projects);

                    for (var s in projects[project]) {
                        var site = projects[project][s];
                        var selected = '';

                        if (site.url.indexOf(domain) > -1) {
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
                    $projects.val(selected_project).trigger('change');
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

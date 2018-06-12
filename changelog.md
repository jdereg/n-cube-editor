### Revision History
* 1.1.35
  * Allow blank scope in values mode
* 1.1.34
  * Include PR #556, Commit option hidden when user had update, but not commit permissions
* 1.1.33
  * Consume n-cube 4.3.2
  * Consumed Tomcat 8.5.31  
  * Consumed spring-boot 1.5.12.RELEASE
* 1.1.32
  * Consumed n-cube 4.3.1
  * Consumed groovy 2.4.15
  * Consumed spring-boot 1.5.10.RELEASE
  * Consumed Tomcat 8.5.29
  * Consumed gmaven-plus 1.6
* 1.1.31
  * Consumed n-cube 4.3.0
* 1.1.30
  * Rule conditions no longer lose any new lines (`\n`) in the text.
  * Show full `ApplicationID` when updating or committing branch.
  * NCube urls are now available using the tab dropdown menu. This will allow direct access to that NCube via link.
  * Pull request can now be found outside date range.
  * Fixed issues on pull request modal calling the server more than it should.
  * Consumed n-cube 4.2.5
* 1.1.29
  * NCE updated to not execute cells when filtering, except when in 'values' mode.
  * Consumed n-cube 4.2.4
* 1.1.28
  * Consumed n-cube 4.2.3
* 1.1.27
  * Consumed n-cube 4.2.2
  * Consumed tomcat 8.5.24
  * Consumed spring boot 1.5.9.RELEASE
* 1.1.26
  * Consumed n-cube 4.2.1
  * Fix cube-to-cube link issue.
  * Fix handling different return types that could be received from `NCube.mapReduce()` for filter.
* 1.1.25
  * Consumed n-cube 4.2.0
  * Fix cube link breaking url link issue.
* 1.1.24
  * Consumed n-cube 4.1.27
* 1.1.23
  * Implemented values mode on the front end to utilize new `getCells` API.
  * Consumed n-cube 4.1.26
* 1.1.22
  * Consumed n-cube 4.1.25
* 1.1.21
  * Consumed n-cube 4.1.24
* 1.1.20
  * FormBuilder enhancement: Allow `Back` button on plugins to restart the plugin with previously entered values.
  * FormBuilder enhancement: Use title on readonly table elements to allow hidden overflow and hover for full text (saves space).
  * FormBuilder bug fix: Could not change modal size when reusing FormBuilder instance. 
  * FormBuilder bug fix: Sortable headers were broken.
  * Changed "PR ID" to "Notes" on pull request modal.
  * Fixed display issues with pull request notes.
  * Removed tooltip in favor of HTML native `title` attribute.
  * Modified display of tab overflow dropdown to be more user-friendly.
  * Made cell value text selected when moving cells while editing.
  * Consumed n-cube 4.1.23
* 1.1.19
  * Consumed n-cube 4.1.22
* 1.1.18
  * Add axis modal now defaults to sorted columns. 
  * Added date pickers to pull request modal.
  * Updated toast to show full message on pull requests errors.
  * Added dynamic table population support to form builder.
  * Added support to see revision history for cubes currently in a deleted state.
  * Changed n-cube view search to keep focus on the search field while changing table selection.
  * Bug fix: Using the server to get CDN data to prevent CORS issues.
  * Bug fix: Dates sorted correctly for dropdowns on pull request modal.
  * Bug fix: Trim input fields for visualizer find node and cube contains search.
  * Consumed n-cube 4.1.21
* 1.1.17
  * Consumed n-cube 4.1.20
* 1.1.16
  * Consumed n-cube 4.1.19
* 1.1.15
  * Enhancement: Ability to add notes to pull requests.
  * Enhancement: Pull request modal no longer refreshes on heartbeat, has button instead for performance.
  * Removed `Clear Server Cache` option as it was not relevant now that caches are removed.
  * Consumed n-cube 4.1.17
* 1.1.14
  * Bug fix: Ace pop-out would not be readonly while viewing HEAD.
  * Consumed n-cube 4.1.16
* 1.1.13
  * Enhancement: Add error map from `BranchMergeException` during pull request merge.
  * Enhancement: Add clickable cube links from column names (e.g. rule conditions).
  * Consumed n-cube 4.1.15
* 1.1.12
  * Consumed n-cube 4.1.14
  * Bug fix: Columns with metaProperties but not name would show `undefined` for name in hide columns modal.  
* 1.1.11
  * Consumed n-cube 4.1.13
* 1.1.10
  * Consumed n-cube 4.1.12
* 1.1.9
  * Consumed n-cube 4.1.11
* 1.1.8
  * Consumed n-cube 4.1.10 
* 1.1.7
  * Consumed n-cube 4.1.9
* 1.1.6
  * Consumed n-cube 4.1.8
* 1.1.5
  * Consumed n-cube 4.1.7
  * Enhancement: Form builder support for table sections
  * Enhancement: History changed to not include left hand nav for fewer server calls
  * Bug fix: Commit would call server if no cubes selected
* 1.1.4
  * Consumed n-cube 4.1.6
  * Faster retrieval of NCubes from storage server - they are now sent compressed (never expanded until being hydrated on the client.)
  * Added `server.tomcat.max-threads=200` to default `application.properties`
  * Modal updates for search options and delete/restore cubes; code cleanup.
  * Bug fix: form-builder not properly adding table rows from add button.
* 1.1.3
  * Consumed n-cube 4.1.4
* 1.1.2
  * Consumed n-cube 4.1.2
* 1.1.1
  * Consumed n-cube 4.1.1
* 1.1.0
  * Consumed n-cube 4.1.0
* 1.0.6
  * Consumed n-cube 4.0.24
  * Bug fix: NCE plug-in modal title sizing issue  
* 1.0.3
  * Consumed n-cube 4.0.22
  * Enabled Spring Boot /info endpoint to show version information
* 0.9.0
  * Updated Spring Boot version to 1.5.3
  * Removed logback-spring.xml. Control logging via application.properties
  * Added "annotate" to cell editor modal to see change history
  * Converted project to be a Spring Boot app
  * Changed confusing UI around batch reference axis update.
  * Updated HandsonTable version to 0.33.0.
* 0.8.0
  * Added getCube() to public API and allow it to "fail" silently so null can be returned.
  * Enhancement: Option of thin copy of branch. This only copies branch tip with an underlying layer of HEAD matching branch tip SHA1.
  * Enhancement: Quick change between edit cells using arrow keys, WSAD, or arrow buttons on edit cell modal.
  * Bug fix: Current view unnecessarily reloading data.
* 0.6.0
  * Massive improvement in version control support
* 0.5.0
  * Enhancement: Scope-build on Visualizer page.  Allows user to set up input Map to be used for Visualizer display.
  * Enhancement: Visualize n-cube as connected network (graphs)
  * Enhancement: Reference Axis support.  Cube axes can now point to 'reference' or 'definitional axes' so that if the referred to axis is modified, so to is the referring axis (data is not duplicated).
  * Enhancement: Filter rows
  * Enhancement: Single cube commit, update, and compare
  * Enhancement: Tabs can be drag-n-dropped rearranged
  * Enhancement: cut / copy / paste now copy cells exact (e.g. GroovyExpression is not turned into a String).  Also, if the content to be copied contains newlines or quotes, that is handled properly as well.
  * Enhancement: In order to copy from NCE to Excel, you can toggle the clipboard mode (Ctrl-K or Cmd-K on macs).  This will toggle the copy mode.  When toggle, the information on the clipboard with either be copied in NCE mode (with extra information about the cell type - maintains cell type) or in Excel mode (compatible with pasting into Excel). 
  * Enhancement: Revision History now allows two cubes to be compared.
  * Enhancement: Commit / Rollback modal now allows two cubes to be compared.
  * Enhancement: Merge Conflicts modal now allows two cubes to be compared.
  * Enhancement: Added Alt-click to display coordinate of currently selected in pop-up window.
  * Enhancement: Added Server Info display to Data (Geek) menu
  * Enhancement: Added HTTP Header display to Data (Geek) menu
  * Enhancement: Updated to use n-cube 3.4.8
  * Enhancement: Hide columns
  * Enhancement: Move Axis
  * Enhancement: Frozen columns / headers
  * Enhancement: Multiple n-cubes (tabs) open
  * Enhancement: Revision history - Compare, Promote
  * Enhancement: Search (find) within columns / cells
* 0.4.0
  * 10x speed up in loading the cube HTML.  No longer sending String return values to resolveRefs (5x) and adding single listener to table instead of a listener-per-cell (5x).
  * Enhancement: 'Processing...' (toast) messages pop up now for menu items that generally take a bit of time to execute.  This allows the menu click to be processed, the 'toast' to be displayed, and then the toast clears and the appropriate modal displays. 
  * Bug fix: NPE was occuring when scanning GroovyTemplate cells (that were empty) for cube name references (invoked from 'Show Inbound References' menu).  Fixed.
  * Bug fix: NPE was occurring on the back-end because the front-end was allowing "" for column values which is illegal. Fixed.  
  * Bug fix: Update branch 'accept mine' was merging the branch cube into HEAD.  Instead it should have updated the headSha1 of the branch cube to match the HEAD cube so that it was prepared-to-overwrite when committed.
  * Bug fix: When there is no cube in the HEAD and cube is created/deleted/restored, it was throwing an error.  Instead, this should be treated as a create to HEAD on commit.
  * Bug fix: When duplicating an n-cube, there was an error being displayed about NCE unable to call getAppNames(), caused by parameter mismatch in Ajax function call. Fixed.
  * Clean up: When you switch applications, versions, or branch, the menu is rebuilt, because sys.menu may be different per anyone of these selectors. 
  * Clean up: All tabs now have intelligent displays when there are 0 cubes available in the selected App.
  * Fancy splash screen logo added to application start-up.
* 0.3.0
  * Update Branch - Before it was operating transactionally, meaning that no cubes were updated if there were any merge conflict.  Now, Update branch makes all possible updates (commits them) and then shows the number of updates, merges, and conflicts.  If there are any conflicts, a merge conflict window will pop-up to allow the conflict to be resolved.
  * Search now only searches locally in memory unless the 'contains' field has content.  This dramatically speeds up search and reduces a lot of database server load.
  * Search now illustrates the selected text in the drop down even when a wildcard ('*') is used.
  * Rule names - now display much nicer (charms) and without the 'name:' text.
  * Rule conditions - user can now enter `url|` or `cache|` in front of the rule condition to indicate that the expression should be cached (or from a URL).  Both can be used, or either one, or no prefix.
  * Link highlight / substitution - the algorithm that matches the cube names within the cube cells now finds the longer cube names before the shorter cube names. It also handles multiple in a cell.  The algorithm no longer attempts substitutions in URLs, which was rendering the URL unable to be clicked and followed.
  * Cube HTML is loaded faster using `innerHTML` instead of JQuery HTML (loads cube HTML twice as fast).  Similarly, where possible, `.textContent` is used as it is nearly 20x faster than JQuery's `.html()` or `.text()`.
  * Default cell values are now displayed (in light gray) so that you can easily tell when a cell will pickup the n-cube level default.
  * The default cell can now be completely set from the 'Details' page (`GroovyExpression`, `String`, `Template`, ... all data types and linked types).
  * The back-button now recognizes when the app, version, status, and branch have not change, and simply selects the desired cube (rather than reload cubes for the changed app, version, etc.).  This makes the normal back-button use-case much faster.
  * 'Loading...' is now displayed when the application is starting.
  * Test tab styles updated to match the rest of the application.
  * Test inputs can now be `GroovyExpressions` or `Groovy Templates` (any `CommandCell`).
  * Application and Versions list now use single `bootstrap-select` widget so that they use much less vertical screen space, allowing more n-cubes to show.
  * Updated to n-cube 3.3.9
  * Updated to Twitter Bootstrap 3.3.5
  * Updated to JQuery 2.1.4.
  * New logo image.
  * Added favicon.ico
* 0.2.0
  * Updated to use n-cube 3.3.3 (using new search API)
  * Added HTML / JSON / Compare buttons to the Revision History screen
* 0.1.0
  * Initial version

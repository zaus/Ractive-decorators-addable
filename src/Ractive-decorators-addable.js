/*

	Ractive-decorators-addable
	===========================

	Version <%= VERSION %>.

	This plugin adds a 'addable' decorator to Ractive, which enables
	elements that correspond to array members to be added and removed.

	==========================

	Troubleshooting: If you're using a module system in your app (AMD or
	something more nodey) then you may need to change the paths below,
	where it says `require( 'Ractive' )` or `define([ 'Ractive' ]...)`.

	==========================

	Usage: Include this file on your page below Ractive, e.g:

	    <script src='lib/Ractive.js'></script>
	    <script src='lib/Ractive-decorators-addable.js'></script>

	Or, if you're using a module loader, require this module:

	    // requiring the plugin will 'activate' it - no need to use
	    // the return value
	    require( 'Ractive-decorators-addable' );

	Then use the decorator like so:

	    <!-- template -->
	    <ul>
	      {{#list}}
	        <li decorator='addable'>{{.}}</li>
	      {{/list}}
	    </ul>

	    var ractive = new Ractive({
	      el: myContainer,
	      template: myTemplate,
	      data: { list: [ 'Firefox', 'Chrome', 'Internet Explorer', 'Opera', 'Safari', 'Maxthon' ] }
	    });
*/

var addableDecorator = (function ( global, factory ) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		factory( require( 'Ractive' ) );
	}

	// AMD?
	else if ( typeof define === 'function' && define.amd ) {
		define([ 'Ractive' ], factory );
	}

	// browser global
	else if ( global.Ractive ) {
		factory( global.Ractive );
	}

	else {
		throw new Error( 'Could not find Ractive! It must be loaded before the Ractive-decorators-addable plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function ( Ractive ) {

	'use strict';

	var addable,
		ractive,
		sourceKeypath,
		sourceArray,
		sourceIndex,

		btnAdd,
		btnRemove,

		addHandler,
		remHandler,

		errorMessage;

	addable = function (node, content, options) {
		//node.addable = true;

		options = utils_extend({}, addable, options);

		// add interactive ui
		if (!node._addable) node._addable = {};

		// maybe only one add button
		if (options.allAdd || !node._addable.hasAdd) {
			btnAdd = document.createElement(options.elementName);
			btnAdd.addEventListener('click', addHandler, false);
			btnAdd.innerHTML = options.addText;
			btnAdd.className = options.addClass;

			// where to add?
			if (options.allAdd) node.addChild(btnAdd);
			else {
				node.parentNode.insertBefore(btnAdd, node);
				node._addable.hasAdd = true;
				// might as well set parent property while we're here once
				node.parentNode.className = node.parentNode.className + ' ' + options.className;
			}
		}


		btnRemove = document.createElement(options.elementName);
		btnRemove.addEventListener('click', remHandler, false);
		btnRemove.innerHTML = options.remText;
		btnRemove.className = options.remClass;

		// try to append, otherwise add
		if (node.nextSibling) node.parentNode.insertBefore(btnRemove, node.nextSibling);
		else node.parentNode.appendChild(btnRemove);

		return {
			teardown: function () {
				btnRemove.removeEventListener('click', remHandler, false);
				btnAdd.removeEventListener('click', addHandler, false);

				node.removeChild(btnRemove);
				btnAdd.parentNode.removeChild(btnAdd);

				node.parentNode.className = node.parentNode.className.replace(' ' + options.className, '');
			}
		};
	};

	addable.className = 'addable';

	addable.elementName = 'span';
	addable.addText = 'Add';
	addable.addClass = 'btn add';
	addable.remText = 'Delete';
	addable.remClass = 'btn delete';

	//#region ----- utilities ----------
	var utils_extend = function () {

		return function (target) {
			var prop, source, sources = Array.prototype.slice.call(arguments, 1);
			while (source = sources.shift()) {
				for (prop in source) {
					if (source.hasOwnProperty(prop)) {
						target[prop] = source[prop];
					}
				}
			}
			return target;
		};
	}();
	if (!Array.isArray) {
		Array.isArray = function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
	}
	//#endregion ----- utilities ----------

	errorMessage = 'The addable decorator only works with elements that correspond to array members';

	addHandler = function ( event ) {
		var storage = this._ractive, lastDotIndex;

		sourceKeypath = storage.keypath;

		// this decorator only works with array members!
		lastDotIndex = sourceKeypath.lastIndexOf( '.' );

		if ( lastDotIndex === -1 ) {
			throw new Error( errorMessage );
		}

		sourceArray = sourceKeypath.substr( 0, lastDotIndex );
		sourceIndex = +( sourceKeypath.substring( lastDotIndex + 1 ) );

		if ( isNaN( sourceIndex ) ) {
			throw new Error( errorMessage );
		}

		console.log('adding', sourceArray, sourceIndex, sourceKeyPath);

		// keep a reference to the Ractive instance that 'owns' this data and this element
		ractive = storage.root;

		var source = ractive.get(sourceArray);
		var current = ractive.get(sourceKeypath);

		// make a copy of current
		if (Array.isArray(current)) current = [];
		else if(typeof(current) === "object") current = utils_extend({}, current);

		if (Array.isArray(source)) ractive.splice(sourceArray, sourceIndex, 0, current);
		else {
			source[sourceIndex + 1] = current;
			ractive.update(); // because we changed the data directly
		}
	};
	remHandler = function (event) {
		var storage = this._ractive, lastDotIndex;

		sourceKeypath = storage.keypath;

		// this decorator only works with array members!
		lastDotIndex = sourceKeypath.lastIndexOf('.');

		if (lastDotIndex === -1) {
			throw new Error(errorMessage);
		}

		sourceArray = sourceKeypath.substr(0, lastDotIndex);
		sourceIndex = +(sourceKeypath.substring(lastDotIndex + 1));

		if (isNaN(sourceIndex)) {
			throw new Error(errorMessage);
		}

		console.log('removing', sourceArray, sourceIndex, sourceKeyPath);

		// keep a reference to the Ractive instance that 'owns' this data and this element
		ractive = storage.root;

		var source = ractive.get(sourceArray);

		if (Array.isArray(source)) ractive.splice(sourceArray, sourceIndex, 1);
		else {
			delete source[sourceIndex];
			ractive.update(); // because we changed the data directly
		}
	};
	
	// expose
	Ractive.decorators.addable = addable;
	return addable;
}));

// Common JS (i.e. browserify) environment
if ( typeof module !== 'undefined' && module.exports) {
	module.exports = addableDecorator;
}

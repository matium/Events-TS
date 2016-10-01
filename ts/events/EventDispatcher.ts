/// <reference path="Event.ts" />

/**
 * Created by Keita Watanabe on 2016/09/30.
 *
 * createJSのEventDispatcherクラスが優秀なので、TypeScript2.0でリライトし、
 * EventDispatcherクラス単体で使用および拡張できるようにしている。
 *
 * ベースをTS2.0で作り変えているが、createJSのEventDispatcherクラスと同じように動作する。
 * 拡張を可能にすることで、DOMを拡張したクラス以外のクラスでも、
 * カスタムイベントを発火・リスナーの登録が可能なクラスとして定義できるように作られている。
 *
 * Example:
 * class YourClass extends events.EventDispatcher {
 *     constructor() {
 *         super();
 *         // do stuff...
 *     }
 * }
 *
 */

namespace events {


	export class EventDispatcher {


		////// static public methods: /////////////////////////
		/**
		 * Static initializer to mix EventDispatcher methods into a target object or prototype.
		 *
		 * 		EventDispatcher.initialize(MyClass.prototype); // add to the prototype of the class
		 * 		EventDispatcher.initialize(myObject); // add to a specific instance
		 *
		 * @method initialize
		 * @static
		 * @param {Object} target The target object to inject EventDispatcher methods into.
		 * This can be an instance or a prototype.
		 **/
		public static initialize(target:any) {
			var p = <any> EventDispatcher.prototype;
			target.addEventListener = p.addEventListener;
			target.on = p.on;
			target.removeEventListener = target.off = p.removeEventListener;
			target.removeAllEventListeners = p.removeAllEventListeners;
			target.hasEventListener = p.hasEventListener;
			target.dispatchEvent = p.dispatchEvent;
			target._dispatchEvent = p._dispatchEvent;
			target.willTrigger = p.willTrigger;
		}


		////// public properties: /////////////////////////
		/**
		 * parent element
		 */
		public parent:EventDispatcher;


		////// private properties: /////////////////////////

		/**
		 * Registered Listeners
		 **/
		protected _listeners: any = null;

		/**
		 * Registered Listeners on useCapture
		 **/
		protected _captureListeners: any = null;


		////// constructor: /////////////////////////
		/**
		 * EventDispatcher provides methods for managing queues of event listeners and dispatching events.
		 *
		 * You can either extend EventDispatcher or mix its methods into an existing prototype or instance
		 * by using the EventDispatcher initialize method.
		 *
		 * Together with the Event class, EventDispatcher provides an extended event model that is based on the
		 * DOM Level 2 event model, including addEventListener, removeEventListener, and dispatchEvent.
		 * It supports bubbling / capture, preventDefault, stopPropagation, stopImmediatePropagation,
		 * and handleEvent.
		 *
		 * EventDispatcher also exposes a "on" method, which makes it easier
		 * to create scoped listeners, listeners that only run once,
		 * and listeners with associated arbitrary data.
		 * The "off" method is merely an alias to removeEventListener.
		 *
		 * Another addition to the DOM Level 2 model is the removeAllEventListeners method,
		 * which can be used to listeners for all events, or listeners for a specific event.
		 * The Event object also includes a remove method which removes the active listener.
		 *
		 * If you want to use addEventListener instead, you may want to use
		 * function.bind() or a similar proxy to manage scope.
		 *
		 * @class EventDispatcher
		 **/
		constructor() {

		}


		////// public methods: /////////////////////////

		/**
		 * Adds the specified event listener. Note that adding multiple listeners to the same function
		 * will result in multiple callbacks getting fired.
		 *
		 * <h4>Example</h4>
		 *
		 *      displayObject.addEventListener("click", handleClick);
		 *      function handleClick(event) {
		 *         // Click happened.
		 *      }
		 *
		 * @param {String} type The string type of the event.
		 * @param {Function | Object} listener An object with a handleEvent method, or a function that will be called when
		 * the event is dispatched.
		 * @param {Boolean} useCapture For events that bubble, indicates whether to
		 * listen for the event in the capture or bubbling/target phase.
		 * @return {Function | Object} Returns the listener for chaining or assignment.
		 **/
		public addEventListener(type:string, listener:Function, useCapture?:boolean):any
		{
			var listeners:any;
			if(useCapture)
			{
				listeners = this._captureListeners = this._captureListeners || {};
			}
			else
			{
				listeners = this._listeners = this._listeners || {};
			}
			var arr:any[] = listeners[type];
			if(arr)
			{
				this.removeEventListener(type, listener, useCapture);
			}
			arr = listeners[type]; // remove may have deleted the array
			if(!arr)
			{
				listeners[type] = [listener];
			}
			else
			{
				arr.push(listener);
			}
			return listener;
		}


		/**
		 * A shortcut method for using addEventListener that makes it easier to specify an execution scope,
		 * have a listener
		 * only run once, associate arbitrary data with the listener, and remove the listener.
		 *
		 * This method works by creating an anonymous wrapper function and subscribing it with addEventListener.
		 * The wrapper function is returned for use with `removeEventListener` (or `off`).
		 *
		 * <b>IMPORTANT:</b> To remove a listener added with `on`, you must pass in the returned wrapper
		 * function as the listener, or use remove. Likewise, each time you call "on" a NEW wrapper
		 * function is subscribed, so multiple calls
		 * to "on" with the same params will create multiple listeners.
		 *
		 * <h4>Example</h4>
		 *
		 * 		var listener = myBtn.on("click", handleClick, null, false, {count:3});
		 * 		function handleClick(evt, data) {
		 * 			data.count -= 1;
		 * 			console.log(this == myBtn); // true - scope defaults to the dispatcher
		 * 			if (data.count == 0) {
		 * 				alert("clicked 3 times!");
		 * 				myBtn.off("click", listener);
		 * 				// alternately: evt.remove();
		 * 			}
		 * 		}
		 *
		 * @method on
		 * @param {String} type The string type of the event.
		 * @param {Function | Object} listener An object with a handleEvent method,
		 * or a function that will be called when the event is dispatched.
		 * @param {Object} [scope] The scope to execute the listener in. Defaults to the
		 * dispatcher/currentTarget for function listeners, and to the listener itself for object listeners
		 * (ie. using handleEvent).
		 * @param {Boolean} [once=false] If true, the listener will remove itself
		 * after the first time it is triggered.
		 * @param {*} [data] Arbitrary data that will be included as the second parameter
		 * when the listener is called.
		 * @param {Boolean} [useCapture=false] For events that bubble, indicates whether
		 * to listen for the event in the capture or bubbling/target phase.
		 * @return {Function} Returns the anonymous function that was created and assigned as the listener.
		 * This is needed to remove the listener later using .removeEventListener.
		 **/
		public on(type, listener, scope, once, data, useCapture):any
		{
			if (listener.handleEvent) {
				scope = scope||listener;
				listener = listener.handleEvent;
			}
			scope = scope||this;
			return this.addEventListener(type, function(evt) {
				listener.call(scope, evt, data);
				once&&evt.remove();
			}, useCapture);
		}


		/**
		 * Removes the specified event listener.
		 *
		 * <h4>Example</h4>
		 *
		 *      yourInstance.removeEventListener("click", handleClick);
		 *
		 * @param {String} type The string type of the event.
		 * @param {Function | Object} listener The listener function or object.
		 * @param {Boolean} [useCapture] For events that bubble, indicates whether to
		 * listen for the event in the capture or bubbling/target phase.
		 **/
		public removeEventListener(type:string, listener:Function, useCapture?:boolean):void
		{
			var listeners:any = useCapture ? this._captureListeners : this._listeners;
			if(!listeners)
			{
				return;
			}
			var arr:any[] = listeners[type];
			if(!arr)
			{
				return;
			}
			for(var i = 0, l = arr.length; i < l; i++)
			{
				if(arr[i] == listener)
				{
					if(l == 1)
					{
						delete(listeners[type]);
					} // allows for faster checks.
					else
					{
						arr.splice(i, 1);
					}
					break;
				}
			}
		}


		/**
		 * A shortcut to the removeEventListener method, with the same parameters and return value.
		 * This is a companion to the .on method.
		 *
		 * <b>IMPORTANT:</b> To remove a listener added with "on", you must pass in the returned
		 * wrapper function as the listener. See "on" for an example.
		 *
		 * @method off
		 * @param {String} type The string type of the event.
		 * @param {Function | Object} listener The listener function or object.
		 * @param {Boolean} [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
		 **/
		public off = this.removeEventListener;


		/**
		 * Removes all listeners for the specified type, or all listeners of all types.
		 *
		 * <h4>Example</h4>
		 *
		 *      // Remove all listeners
		 *      displayObject.removeAllEventListeners();
		 *
		 *      // Remove all click listeners
		 *      displayObject.removeAllEventListeners("click");
		 *
		 * @method removeAllEventListeners
		 * @param {String} [type] The string type of the event. If omitted,
		 * all listeners for all types will be removed.
		 **/
		public removeAllEventListeners(type?:string):void
		{
			if(!type)
			{
				this._listeners = this._captureListeners = null;
			}
			else
			{
				if(this._listeners)
				{
					delete(this._listeners[type]);
				}
				if(this._captureListeners)
				{
					delete(this._captureListeners[type]);
				}
			}
		}


		/**
		 * Dispatches the specified event to all listeners.
		 *
		 * <h4>Example</h4>
		 *
		 *      // Use a string event
		 *      this.dispatchEvent("complete");
		 *
		 *      // Use an Event instance
		 *      var event = new Event("progress");
		 *      this.dispatchEvent(event);
		 *
		 * @method dispatchEvent
		 * @param {Object | String | Event} eventObj An object with a "type" property, or a string type.
		 * While a generic object will work, it is recommended to use a CreateJS Event instance. If a string is used,
		 * dispatchEvent will construct an Event instance with the specified type.
		 * @param {Object} [target] The object to use as the target property of the event object. This will default to the
		 * dispatching object. <b>This parameter is deprecated and will be removed.</b>
		 * @return {Boolean} Returns the value of eventObj.defaultPrevented.
		 **/
		public dispatchEvent(eventObj:string, target?:any);
		public dispatchEvent(eventObj:events.Event, target?:any);
		public dispatchEvent(eventObj:any, target?:any)
		{
			if(typeof eventObj == "string")
			{
				// won't bubble, so skip everything if there's no listeners:
				var listeners:any = this._listeners;
				if(!listeners || !listeners[eventObj])
				{
					return false;
				}
				eventObj = new Event(eventObj);
			}
			// TODO: deprecated. Target param is deprecated, only use case is MouseEvent/mousemove, remove.
			try
			{
				eventObj.target = target || this;
			} catch(e)
			{
			} // allows redispatching of native events

			if(!eventObj.bubbles || !this.parent)
			{
				this._dispatchEvent(eventObj, 2);
			}
			else
			{
				var top:EventDispatcher = this;
				var list:any[] = [top];
				while(top.parent)
				{
					list.push(top = top.parent);
				}
				var i:number;
				var l:number = list.length;

				// capture & atTarget
				for(i = l - 1; i >= 0 && !eventObj.propagationStopped; i--)
				{
					list[i]._dispatchEvent(eventObj, 1 + ((i == 0) ? 1 : 0 ));
				}

				// bubbling
				for(i = 1; i < l && !eventObj.propagationStopped; i++)
				{
					list[i]._dispatchEvent(eventObj, 3);
				}
			}
			return eventObj.defaultPrevented;
		}


		/**
		 * Indicates whether there is at least one listener for the specified event type.
		 * @method hasEventListener
		 * @param {String} type The string type of the event.
		 * @return {Boolean} Returns true if there is at least one listener for the specified event.
		 **/
		public hasEventListener(type:string)
		{
			var listeners:any = this._listeners;
			var captureListeners:any = this._captureListeners;
			return !!((listeners && listeners[type]) || (captureListeners && captureListeners[type]));
		}


		/**
		 * Indicates whether there is at least one listener for the specified event type on this object
		 * or any of its ancestors (parent, parent's parent, etc).
		 * A return value of true indicates that if a bubbling event of the specified type is dispatched
		 * from this object, it will trigger at least one listener.
		 *
		 * This is similar to hasEventListener, but it searches the entire event flow for a listener,
		 * not just this object.
		 * @method willTrigger
		 * @param {String} type The string type of the event.
		 * @return {Boolean} Returns `true` if there is at least one listener for the specified event.
		 **/
		public willTrigger(type:string)
		{
			var o:EventDispatcher = this;
			while(o)
			{
				if(o.hasEventListener(type))
				{
					return true;
				}
				o = o.parent;
			}
			return false;
		}


		/**
		 * @method toString
		 * @return {String} a string representation of the instance.
		 **/
		public toString():string
		{
			return "[EventDispatcher]";
		}


		public destruct():void
		{
			this.removeAllEventListeners();
		}



		////// private methods: /////////////////////////

		/**
		 * @method _dispatchEvent
		 * @param {Object | String | Event} eventObj
		 * @param {number} eventPhase
		 * @protected
		 **/
		public _dispatchEvent(eventObj:any, eventPhase:number):void
		{
			var l, listeners = (eventPhase == 1) ? this._captureListeners : this._listeners;
			if(eventObj && listeners)
			{
				var arr = listeners[eventObj.type];
				if(!arr || !(l = arr.length))
				{
					return;
				}
				try
				{
					eventObj.currentTarget = this;
				} catch(e)
				{
				}
				try
				{
					eventObj.eventPhase = eventPhase;
				} catch(e)
				{
				}
				eventObj.removed = false;
				arr = arr.slice(); // to avoid issues with items being removed or added during the dispatch
				for(var i = 0; i < l && !eventObj.immediatePropagationStopped; i++)
				{
					var o = arr[i];
					if(o.handleEvent)
					{
						o.handleEvent(eventObj);
					}
					else
					{
						o(eventObj);
					}
					if(eventObj.removed)
					{
						this.removeEventListener(eventObj.type, o, eventPhase == 1);
						eventObj.removed = false;
					}
				}
			}
		}


	}
}



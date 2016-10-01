/// <reference path="events/Event.ts" />
/// <reference path="events/EventDispatcher.ts" />

namespace jp.matium {

	import Event = events.Event;
	import EventDispatcher = events.EventDispatcher;

	/**
	 * EventDispatcherを拡張するサンプル
	 */
	export class SampleEventDispatcher extends EventDispatcher {

		/**
		 * コンストラクタ
		 */
		constructor() {
			super();
		}

		/**
		 * 実行メソッド
		 */
		public run():void {
		}

	}
}

/**
 * グローバルメンバーの登録（メインクラスの定義）
 */
var main:jp.matium.SampleEventDispatcher;

/**
 * メインクラスの作成と実行
 */
document.addEventListener("DOMContentLoaded", function(){
	main = new jp.matium.SampleEventDispatcher();
	main.run();
}, false);